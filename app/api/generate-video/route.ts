export const dynamic = "force-dynamic"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"

const ANON_COOKIE = "anon_credits"
const DEFAULT_ANON_CREDITS = 0
const DEFAULT_LOGGED_IN_CREDITS = 2

// 开发模式：跳过积分验证
const DEV_MODE = process.env.DEV_MODE === "true"

function parseIntSafe(value: string | null) {
  if (!value) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  console.log("[Route] POST /api/generate-video - start", {
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

    let parsedBody: { prompt?: unknown; image?: unknown; model?: unknown; cost?: unknown }
    try {
      parsedBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("[Route] invalid JSON body", parseError)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const { prompt, image, model } = parsedBody
    
    // Validate required fields
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 })
    }
    
    if (!model || typeof model !== "string") {
      return NextResponse.json({ error: "Missing or invalid model" }, { status: 400 })
    }

    // Calculate cost based on model
    // High quality models use 60 credits, fast models use 10 credits
    let costPerGeneration = 10; // Default to fast model cost
    if (model === "veo3.1-landscape") {
      // High quality cinematic landscape model - 60 credits
      costPerGeneration = 60;
    } else if (model === "veo3.1-portial") {
      // Fast portrait model for social media - 10 credits
      costPerGeneration = 10;
    } else if (model.startsWith("veo3.1-")) {
      // Other VEO 3.1 models - use 60 credits by default
      costPerGeneration = 60;
    }
    
    console.log("[Route] payload", {
      prompt: prompt.slice(0, 100),
      hasImage: Boolean(image),
      model,
      costPerGeneration
    })

    // 开发模式：跳过积分验证
    if (!DEV_MODE) {
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
    } else {
      console.log("[Route] DEV_MODE enabled - skipping credit check")
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
      
      // Build content array
      const content = [
        {
          "type": "text",
          "text": prompt
        }
      ]
      
      // Add image if provided
      if (image && typeof image === "string") {
        content.push({
          "type": "image_url",
          "image_url": {
            "url": image
          }
        })
      }
      
      // Try with the requested model first, then fall back to gemini model if it fails
      const modelsToTry = [model, "gemini-2.5-flash-image"];
      let modelUsed: string;
      let response: Response;
      
      for (const currentModel of modelsToTry) {
        modelUsed = currentModel;
        
        const requestBody = JSON.stringify({
          model: currentModel,
          messages: [
            {
              "role": "user",
              "content": content
            }
          ]
        })

        response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: requestBody,
        })
        
        statusCode = response.status;
        responseText = await response.text();
        
        console.log("[Route] API status", statusCode, "for model", currentModel);
        console.log("[Route] API raw length", responseText.length);
        console.log("[Route] API raw preview", responseText.slice(0, 500));
        
        // If the response is successful, break out of the loop
        if (statusCode === 200) {
          break;
        }
        
        // If it's a model not found error, try the next model
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error?.code === "model_not_found") {
            console.log("[Route] Model", currentModel, "not found, trying next model");
            continue;
          }
        } catch {
          // If we can't parse the error, break and return the error
          break;
        }
        
        // For other errors, break and return the error
        break;
      }
    } catch (error) {
      console.error("[Route] fetch error", error);
      return NextResponse.json({ error: "Failed to connect to API" }, { status: 500 });
    }

    if (statusCode !== 200) {
      console.error("[Route] API error", statusCode, responseText.slice(0, 200));
      
      // Try to parse the error and provide a more user-friendly message
      let errorMessage = "API error";
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // If we can't parse the error, use the raw response
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          status: statusCode,
          modelError: true
        },
        { status: statusCode }
      );
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
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 })
  }
}