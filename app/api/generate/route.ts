export const dynamic = "force-dynamic"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import https from "https"
import { Readable } from "stream"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"

const ANON_COOKIE = "anon_credits"
const DEFAULT_ANON_CREDITS = 0
const DEFAULT_LOGGED_IN_CREDITS = 0
const COST_TEXT_TO_IMAGE = 1
const COST_IMAGE_TO_IMAGE = 2

// 开发模式：跳过积分验证
const DEV_MODE = process.env.DEV_MODE === "true"

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

    let parsedBody: { prompt?: unknown; image?: unknown; model?: unknown; cost?: unknown; section?: unknown; aspectRatio?: unknown }
    try {
      parsedBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("[Route] invalid JSON body", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { prompt, image, model, cost, section, aspectRatio } = parsedBody
    
    // 根据功能板块判断积分消耗：image-edit = 2积分，其他 = 1积分
    const isImageEdit = section === "image-edit"
    const costPerGeneration = isImageEdit ? COST_IMAGE_TO_IMAGE : COST_TEXT_TO_IMAGE
    
    // 将纵横比转换为提示词后缀
    const aspectRatioSuffix = getAspectRatioPrompt(aspectRatio as string)
    const enhancedPrompt = `${prompt}${aspectRatioSuffix}`
    
    console.log("[Route] payload", {
      prompt: typeof prompt === "string" ? prompt.slice(0, 100) : null,
      hasImage: Boolean(image),
      model,
      cost,
      section,
      isImageEdit,
      aspectRatio,
      enhancedPrompt: typeof enhancedPrompt === "string" ? enhancedPrompt.slice(0, 100) : null,
      costPerGeneration
    })
    
    function getAspectRatioPrompt(ratio?: string): string {
      if (!ratio) return ""
      
      const ratioMap: Record<string, string> = {
        "1:1": ", square aspect ratio, 1:1",
        "16:9": ", wide aspect ratio, 16:9, landscape",
        "9:16": ", tall aspect ratio, 9:16, portrait",
        "4:3": ", standard aspect ratio, 4:3",
        "3:4": ", standard aspect ratio, 3:4"
      }
      
      return ratioMap[ratio] || ""
    }

    interface Message {
      role: string
      content: string | Array<{
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
        content: isImageEdit && image ? [
          {
            type: "text",
            text: enhancedPrompt,
          },
          {
            type: "image_url",
            image_url: {
              url: image,
            },
          }
        ] : enhancedPrompt,
      },
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    // 开发模式：跳过积分验证
    if (DEV_MODE) {
      console.log("[Route] DEV_MODE enabled - skipping credit check")
    } else {
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
          // 登录用户默认获得2个积分
          creditsBefore = DEFAULT_LOGGED_IN_CREDITS
        }
      } else {
        // 未登录用户没有积分
        creditsBefore = DEFAULT_ANON_CREDITS
      }

      if (creditsBefore < costPerGeneration) {
        return NextResponse.json(
          {
            error: "Credits used up. Please sign in and upgrade on the Pricing page.",
            code: "quota_exceeded",
            authenticated: isAuthenticated,
            credits_remaining: creditsBefore,
            cost_per_generation: costPerGeneration,
            upgrade_url: "/pricing",
          },
          { status: 402 },
        )
      }
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
    
    // 开发模式：不扣除积分
    const creditsAfter = DEV_MODE ? creditsBefore : Math.max(0, creditsBefore - costPerGeneration)
    
    const res = NextResponse.json({
      ...(data as object),
      _meta: {
        authenticated: isAuthenticated,
        credits_remaining: creditsAfter,
        cost_per_generation: costPerGeneration,
        dev_mode: DEV_MODE,
      },
    })
    
    // 开发模式：不更新积分
    if (!DEV_MODE) {
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
    }

    return res
  } catch (error) {
    console.error("[Route] error", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
