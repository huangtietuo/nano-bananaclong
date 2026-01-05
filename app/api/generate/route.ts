export const dynamic = "force-dynamic"

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
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      console.error("[Route] missing GEMINI_API_KEY")
      return Response.json({ error: "Missing API key" }, { status: 500 })
    }

    let response: Response
    try {
      console.log("[Route] calling upstream")
      response = await fetch("https://breakout.wenwen-ai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash-image",
          stream: false,
          messages,
        }),
        signal: controller.signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[Route] API timeout")
        return Response.json({ error: "Upstream timeout" }, { status: 504 })
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }

    const raw = await response.text()
    console.log("[Route] API status", response.status)
    console.log("[Route] API raw length", raw.length)
    console.log("[Route] API raw preview", raw.slice(0, 500))

    if (!response.ok) {
      console.error("[Route] API error", response.status, raw.slice(0, 200))
      return Response.json(
        { error: "API error", status: response.status, body: raw },
        { status: response.status }
      )
    }

    if (!raw.trim()) {
      console.error("[Route] empty response body")
      return Response.json({ error: "Empty response from API" }, { status: 502 })
    }

    let data: unknown
    try {
      data = JSON.parse(raw)
      console.log("[Route] parsed data keys", Object.keys(data as object))
    } catch (parseError) {
      console.error("[Route] invalid JSON", parseError)
      return Response.json({ error: "Invalid JSON from API", body: raw }, { status: 502 })
    }

    console.log("[Route] done", { durationMs: Date.now() - startedAt })
    return Response.json(data)
  } catch (error) {
    console.error("[Route] error", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
