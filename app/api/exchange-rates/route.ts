import { NextResponse } from "next/server"

export const runtime = "nodejs"

type RatesResponse = {
  base: string
  date: string
  rates: Record<string, number>
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const base = (url.searchParams.get("base") ?? "USD").toUpperCase()

  try {
    const upstreamUrl = new URL("https://api.frankfurter.app/latest")
    upstreamUrl.searchParams.set("from", base)

    const res = await fetch(upstreamUrl.toString(), {
      next: { revalidate: 60 * 60 },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return NextResponse.json(
        { error: "Failed to fetch exchange rates", status: res.status, body: text.slice(0, 500) },
        { status: 502 },
      )
    }

    const data = (await res.json()) as RatesResponse
    if (!data?.rates || typeof data.rates !== "object") {
      return NextResponse.json({ error: "Invalid exchange rates response" }, { status: 502 })
    }

    return NextResponse.json(
      {
        base: data.base ?? base,
        date: data.date,
        rates: data.rates,
      },
      { status: 200 },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

