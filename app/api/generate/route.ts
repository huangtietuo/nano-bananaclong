export const dynamic = "force-dynamic"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import https from "https"
import { Readable } from "stream"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"

const ANON_COOKIE = "anon_credits"
const DEFAULT_ANON_CREDITS = 2
const COST_PER_GENERATION = 2

function parseIntSafe(value: string | null) {
  if (!value) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  console.log("[Route] POST /api/generate - start", {
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length"),
  })

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthenticated = Boolean(user)
    let creditsBefore: number | null = null

    const bodyText = await request.text()
    console.log("[Route] payload length", bodyText.length)

    if (!bodyText.trim()) {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 })
    }

    let parsedBody: { prompt?: unknown; image?: unknown }
    try {
      parsedBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("[Route] invalid JSON body", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { prompt, image } = parsedBody
    console.log("[Route] payload", {
      prompt: typeof prompt === "string" ? prompt.slice(0, 100) : null,
      hasImage: Boolean(image),
    })

    interface Message {
      role: string
      content: Array<{
        type: string
        text?: string
        image_url?: {
          url: string
        }
      }>
    }

    const messages: Message[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ]

    if (image) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: image,
        },
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    const cookieCredits = parseIntSafe(request.cookies.get(ANON_COOKIE)?.value)
    if (cookieCredits !== null) {
      creditsBefore = Math.max(0, cookieCredits)
    } else if (isAuthenticated) {
      const { data, error } = await supabase
        .from("user_entitlements")
        .select("credits_remaining")
        .eq("user_id", user!.id)
        .maybeSingle()

      if (!error && typeof data?.credits_remaining === "number") {
        creditsBefore = Math.max(0, data.credits_remaining)
      } else {
        creditsBefore = DEFAULT_ANON_CREDITS
      }
    } else {
      creditsBefore = DEFAULT_ANON_CREDITS
    }

    if (creditsBefore < COST_PER_GENERATION) {
      return NextResponse.json(
        {
          error: "Credits used up. Please sign in and upgrade on the Pricing page.",
          code: "quota_exceeded",
          authenticated: isAuthenticated,
          credits_remaining: creditsBefore,
          cost_per_generation: COST_PER_GENERATION,
          upgrade_url: "/pricing",
        },
        { status: 402 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      console.error("[Route] missing GEMINI_API_KEY")
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    let responseText: string
    let statusCode: number
    try {
      console.log("[Route] calling upstream")
      
      const url = new URL("https://breakout.wenwen-ai.com/v1/chat/completions")
      const requestBody = JSON.stringify({
        model: "gemini-2.5-flash-image",
        stream: false,
        messages,
      })

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      })
      
      statusCode = response.status
      responseText = await response.text()
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[Route] API timeout")
        return NextResponse.json({ error: "Upstream timeout" }, { status: 504 })
      }
      console.error("[Route] fetch error", error)
      return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 })
    } finally {
      clearTimeout(timeoutId)
    }

    console.log("[Route] API status", statusCode)
    console.log("[Route] API raw length", responseText.length)
    console.log("[Route] API raw preview", responseText.slice(0, 500))

    if (responseText.length > 10 * 1024 * 1024) {
      console.error("[Route] Response too large:", responseText.length)
      return NextResponse.json(
        { error: "Response too large from API", size: responseText.length },
        { status: 502 }
      )
    }

    if (statusCode !== 200) {
      console.error("[Route] API error", statusCode, responseText.slice(0, 200))
      return NextResponse.json(
        { error: "API error", status: statusCode, body: responseText.slice(0, 1000) },
        { status: statusCode }
      )
    }

    if (!responseText.trim()) {
      console.error("[Route] empty response body")
      return NextResponse.json({ error: "Empty response from API" }, { status: 502 })
    }

    let data: unknown
    try {
      data = JSON.parse(responseText)
      console.log("[Route] parsed data keys", Object.keys(data as object))
    } catch (parseError) {
      console.error("[Route] invalid JSON", parseError)
      return NextResponse.json({ error: "Invalid JSON from API", body: responseText }, { status: 502 })
    }

    console.log("[Route] done", { durationMs: Date.now() - startedAt })
    const creditsAfter = Math.max(0, creditsBefore - COST_PER_GENERATION)
    const res = NextResponse.json({
      ...(data as object),
      _meta: {
        authenticated: isAuthenticated,
        credits_remaining: creditsAfter,
        cost_per_generation: COST_PER_GENERATION,
      },
    })
    res.cookies.set(ANON_COOKIE, String(creditsAfter), { path: "/", maxAge: 60 * 60 * 24 * 30 })

    if (isAuthenticated) {
      const { error: updateError } = await supabase
        .from("user_entitlements")
        .upsert(
          {
            user_id: user!.id,
            credits_remaining: creditsAfter,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      if (updateError) {
        console.error("[Route] update user_entitlements error", updateError)
      }
    }

    return res
  } catch (error) {
    console.error("[Route] error", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
