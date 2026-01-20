import { NextResponse, type NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const COOKIE_NAME = "anon_credits"
const DEFAULT_ANON_CREDITS = 2

function parseIntSafe(value: string | null) {
  if (!value) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

export async function GET(request: NextRequest) {
  const cookieValue = parseIntSafe(request.cookies.get(COOKIE_NAME)?.value)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const current = parseIntSafe(request.cookies.get(COOKIE_NAME)?.value) ?? DEFAULT_ANON_CREDITS
    const normalized = Math.max(0, current)
    const res = NextResponse.json({
      authenticated: false,
      plan: "free",
      credits_remaining: normalized,
      cost_per_generation: 2,
    })
    if (!request.cookies.get(COOKIE_NAME)) {
      res.cookies.set(COOKIE_NAME, String(normalized), { path: "/", maxAge: 60 * 60 * 24 * 30 })
    }
    return res
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("plan, credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    const current = parseIntSafe(request.cookies.get(COOKIE_NAME)?.value) ?? DEFAULT_ANON_CREDITS
    const normalized = Math.max(0, current)
    const res = NextResponse.json({
      authenticated: true,
      plan: "free",
      credits_remaining: normalized,
      cost_per_generation: 2,
    })
    if (!request.cookies.get(COOKIE_NAME)) {
      res.cookies.set(COOKIE_NAME, String(normalized), { path: "/", maxAge: 60 * 60 * 24 * 30 })
    }
    return res
  }

  const dbCredits = typeof data?.credits_remaining === "number" ? data.credits_remaining : DEFAULT_ANON_CREDITS
  const mergedCredits =
    cookieValue !== null ? Math.max(0, Math.max(cookieValue, dbCredits)) : Math.max(0, dbCredits)

  const res = NextResponse.json({
    authenticated: true,
    plan: data?.plan ?? "free",
    credits_remaining: mergedCredits,
    cost_per_generation: 2,
  })
  if (cookieValue === null || cookieValue !== mergedCredits) {
    res.cookies.set(COOKIE_NAME, String(mergedCredits), { path: "/", maxAge: 60 * 60 * 24 * 30 })
  }
  return res
}

