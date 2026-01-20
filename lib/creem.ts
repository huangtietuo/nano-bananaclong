import crypto from "crypto"

export type CreemMode = "test" | "live"

export function getCreemMode(): CreemMode {
  return process.env.NODE_ENV === "production" ? "live" : "test"
}

export function getCreemApiBaseUrl() {
  return getCreemMode() === "test" ? "https://test-api.creem.io" : "https://api.creem.io"
}

export function requireCreemApiKey() {
  const apiKey = process.env.CREEM_API_KEY
  if (!apiKey) {
    throw new Error("Missing CREEM_API_KEY")
  }
  return apiKey
}

export function createCreemSignature(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function creemFetch<T>(
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> } = {},
) {
  const apiKey = requireCreemApiKey()
  const url = new URL(path, getCreemApiBaseUrl())

  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new Error(`Creem API error (${res.status}): ${JSON.stringify(data)}`)
  }

  return data as T
}

export function createRequestId(prefix = "req") {
  return `${prefix}_${crypto.randomUUID()}`
}

