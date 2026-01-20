import { createCreemSignature, safeEqual } from "@/lib/creem"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type CreemWebhookEvent = {
  id: string
  eventType: string
  created_at: number
  object: any
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function requireWebhookSecret() {
  const secret = process.env.CREEM_WEBHOOK_SECRET
  if (!secret) throw new Error("Missing CREEM_WEBHOOK_SECRET")
  return secret
}

function extractReferenceId(evt: CreemWebhookEvent) {
  const metadata = evt.object?.metadata
  const referenceId = metadata?.referenceId ?? metadata?.reference_id ?? metadata?.userId ?? null
  return typeof referenceId === "string" && referenceId.length ? referenceId : null
}

function extractTier(evt: CreemWebhookEvent) {
  const metadataTier = evt.object?.metadata?.tier
  if (metadataTier === "basic" || metadataTier === "pro" || metadataTier === "max") return metadataTier
  return null
}

function resolveTierFromProductId(productId: unknown) {
  if (typeof productId !== "string" || !productId.length) return null
  const proProducts = new Set([
    process.env.CREEM_PRODUCT_PRO_MONTHLY,
    process.env.CREEM_PRODUCT_PRO_YEARLY,
  ].filter(Boolean))
  const maxProducts = new Set([
    process.env.CREEM_PRODUCT_MAX_MONTHLY,
    process.env.CREEM_PRODUCT_MAX_YEARLY,
  ].filter(Boolean))
  const basicProducts = new Set([
    process.env.CREEM_PRODUCT_BASIC_MONTHLY,
    process.env.CREEM_PRODUCT_BASIC_YEARLY,
  ].filter(Boolean))

  if (basicProducts.has(productId)) return "basic"
  if (proProducts.has(productId)) return "pro"
  if (maxProducts.has(productId)) return "max"
  return null
}

export async function POST(request: Request) {
  try {
    const payload = await request.text()
    const signature = request.headers.get("creem-signature") ?? ""
    const secret = requireWebhookSecret()
    const computed = createCreemSignature(payload, secret)

    if (!signature || !safeEqual(signature, computed)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const evt = JSON.parse(payload) as CreemWebhookEvent
    const referenceId = extractReferenceId(evt)

    const admin = createAdminClient()

    const customerId =
      evt.object?.customer?.id ??
      evt.object?.customer ??
      evt.object?.order?.customer ??
      null

    const productId =
      evt.object?.product?.id ??
      evt.object?.product ??
      evt.object?.order?.product ??
      null

    const orderId =
      evt.object?.order?.id ??
      evt.object?.order ??
      null

    let subscriptionId =
      evt.object?.subscription?.id ??
      evt.object?.subscription ??
      null

    if (!subscriptionId && typeof evt.object?.id === "string" && evt.object.id.startsWith("sub_")) {
      subscriptionId = evt.object.id
    }

    const status =
      evt.object?.status ??
      evt.object?.order?.status ??
      null

    const periodStart =
      evt.object?.current_period_start ??
      evt.object?.period_start ??
      evt.object?.periodStart ??
      null

    const periodEnd =
      evt.object?.current_end_period ??
      evt.object?.period_end ??
      evt.object?.periodEnd ??
      null

    const cancelAtPeriodEnd =
      evt.object?.cancel_at_period_end ??
      evt.object?.cancelAtPeriodEnd ??
      null

    const record = {
      reference_id: referenceId,
      creem_customer_id: customerId,
      creem_subscription_id: subscriptionId,
      creem_order_id: orderId,
      product_id: productId,
      status: status ?? evt.eventType,
      period_start: periodStart,
      period_end: periodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      last_event_type: evt.eventType,
      last_event_id: evt.id,
      updated_at: new Date().toISOString(),
    }

    const conflictKey = subscriptionId ? "creem_subscription_id" : orderId ? "creem_order_id" : null
    if (conflictKey) {
      const { error } = await admin.from("creem_subscription").upsert(record, {
        onConflict: conflictKey,
        ignoreDuplicates: false,
      })
      if (error) throw error
    } else {
      const { error } = await admin.from("creem_subscription").insert(record)
      if (error) throw error
    }

    const tier = extractTier(evt) ?? resolveTierFromProductId(productId)
    const canUpdateEntitlements =
      referenceId &&
      isUuid(referenceId) &&
      (evt.eventType === "checkout.completed" ||
        evt.eventType === "subscription.active" ||
        evt.eventType === "subscription.paid" ||
        evt.eventType === "subscription.trialing" ||
        evt.eventType === "subscription.canceled" ||
        evt.eventType === "subscription.expired")

    if (canUpdateEntitlements) {
      if (evt.eventType === "subscription.canceled" || evt.eventType === "subscription.expired") {
        const { error } = await admin.from("user_entitlements").upsert(
          {
            user_id: referenceId,
            plan: "free",
            credits_remaining: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        if (error) throw error
      } else if (tier) {
        const creditsRemaining = tier === "basic" ? 200 : tier === "pro" ? 800 : 3600
        const { error } = await admin.from("user_entitlements").upsert(
          {
            user_id: referenceId,
            plan: tier,
            credits_remaining: creditsRemaining,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
        if (error) throw error
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

