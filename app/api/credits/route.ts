import { NextResponse, type NextRequest } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const COOKIE_NAME = "anon_credits"
// 只有登录用户才能获得积分，未登录用户没有积分
const DEFAULT_ANON_CREDITS = 0
const DEFAULT_LOGGED_IN_CREDITS = 2

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
    // 未登录用户没有积分
    const normalized = 0
    const res = NextResponse.json({
      authenticated: false,
      plan: "free",
      credits_remaining: normalized,
      cost_per_generation: 2,
    })
    // 设置cookie为0，确保未登录用户始终没有积分
    res.cookies.set(COOKIE_NAME, String(normalized), { path: "/", maxAge: 60 * 60 * 24 * 30 })
    return res
  }

  const { data, error } = await supabase
    .from("user_entitlements")
    .select("plan, credits_remaining")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    // 登录用户默认获得2个积分
    const current = parseIntSafe(request.cookies.get(COOKIE_NAME)?.value) ?? DEFAULT_LOGGED_IN_CREDITS
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

  // 登录用户默认获得2个积分
  const dbCredits = typeof data?.credits_remaining === "number" ? data.credits_remaining : DEFAULT_LOGGED_IN_CREDITS
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

