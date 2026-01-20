import { creemFetch, createRequestId } from "@/lib/creem"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type BillingCycle = "monthly" | "yearly"
type Tier = "basic" | "pro" | "max"
type Currency = string

function getAppUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/$/, "")
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function getProductId(tier: Tier, billingCycle: BillingCycle, currency?: Currency) {
  if (currency) {
    const envKey = `CREEM_PRODUCT_${tier.toUpperCase()}_${billingCycle.toUpperCase()}_${currency.toUpperCase()}`
    const value = process.env[envKey]
    if (value) return value
  }

  const fallbackKey = `CREEM_PRODUCT_${tier.toUpperCase()}_${billingCycle.toUpperCase()}`
  const fallbackValue = process.env[fallbackKey]
  if (!fallbackValue) throw new Error(`Missing ${fallbackKey}`)
  return fallbackValue
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const tier = body?.tier as Tier | undefined
    const billingCycle = body?.billingCycle as BillingCycle | undefined
    const currency = typeof body?.currency === "string" ? body.currency : undefined

    if (!tier || !["basic", "pro", "max"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }
    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json({ error: "Invalid billingCycle" }, { status: 400 })
    }

    const appUrl = getAppUrl(request)
    const productId = getProductId(tier, billingCycle, currency)

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 })
    }

    const checkout = await creemFetch<{
      id: string
      checkout_url: string
    }>("/v1/checkouts", {
      method: "POST",
      body: JSON.stringify({
        request_id: createRequestId("checkout"),
        product_id: productId,
        units: 1,
        success_url: `${appUrl}/pricing/success`,
        customer: user?.email ? { email: user.email } : undefined,
        metadata: {
          referenceId: user.id,
          tier,
          billingCycle,
          currency,
        },
      }),
    })

    return NextResponse.json({ url: checkout.checkout_url, checkoutId: checkout.id }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

