export const dynamic = "force-dynamic"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import https from "https"
import { Readable } from "stream"

export async function POST(request: Request) {
  const startedAt = Date.now()
  console.log("[Route] POST /api/generate - start", {
    contentType: request.headers.get("content-type"),
    contentLength: request.headers.get("content-length"),
  })

  try {
    const bodyText = await request.text()
    console.log("[Route] payload length", bodyText.length)

    if (!bodyText.trim()) {
      return Response.json({ error: "Empty request body" }, { status: 400 })
    }

    let parsedBody: { prompt?: unknown; image?: unknown }
    try {
      parsedBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.error("[Route] invalid JSON body", parseError)
      return Response.json({ error: "Invalid JSON body" }, { status: 400 })
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

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      console.error("[Route] missing GEMINI_API_KEY")
      return Response.json({ error: "Missing API key" }, { status: 500 })
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
        return Response.json({ error: "Upstream timeout" }, { status: 504 })
      }
      console.error("[Route] fetch error", error)
      return Response.json({ error: "Failed to connect to API" }, { status: 500 })
    } finally {
      clearTimeout(timeoutId)
    }

    console.log("[Route] API status", statusCode)
    console.log("[Route] API raw length", responseText.length)
    console.log("[Route] API raw preview", responseText.slice(0, 500))

    if (responseText.length > 10 * 1024 * 1024) {
      console.error("[Route] Response too large:", responseText.length)
      return Response.json(
        { error: "Response too large from API", size: responseText.length },
        { status: 502 }
      )
    }

    if (statusCode !== 200) {
      console.error("[Route] API error", statusCode, responseText.slice(0, 200))
      return Response.json(
        { error: "API error", status: statusCode, body: responseText.slice(0, 1000) },
        { status: statusCode }
      )
    }

    if (!responseText.trim()) {
      console.error("[Route] empty response body")
      return Response.json({ error: "Empty response from API" }, { status: 502 })
    }

    let data: unknown
    try {
      data = JSON.parse(responseText)
      console.log("[Route] parsed data keys", Object.keys(data as object))
    } catch (parseError) {
      console.error("[Route] invalid JSON", parseError)
      return Response.json({ error: "Invalid JSON from API", body: responseText }, { status: 502 })
    }

    console.log("[Route] done", { durationMs: Date.now() - startedAt })
    return Response.json(data)
  } catch (error) {
    console.error("[Route] error", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
