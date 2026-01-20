'use client'

import React from "react"
import { LANGUAGES, type Lang, translate } from "@/lib/i18n"

type I18nContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  languages: typeof LANGUAGES
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

function readCookie(name: string) {
  if (typeof document === "undefined") return null
  const parts = document.cookie.split(";").map((p) => p.trim())
  const match = parts.find((p) => p.startsWith(`${name}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(name.length + 1))
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`
}

function getInitialLang(): Lang {
  const fromCookie = readCookie("lang")
  if (fromCookie === "en" || fromCookie === "zh" || fromCookie === "ko") return fromCookie

  const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null
  if (fromStorage === "en" || fromStorage === "zh" || fromStorage === "ko") return fromStorage

  const browser = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
  if (browser.startsWith("zh")) return "zh"
  if (browser.startsWith("ko")) return "ko"
  return "en"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en")

  React.useEffect(() => {
    const initial = getInitialLang()
    setLangState(initial)
  }, [])

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next)
    if (typeof window !== "undefined") window.localStorage.setItem("lang", next)
    writeCookie("lang", next)
    window.dispatchEvent(new CustomEvent("lang:change", { detail: { lang: next } }))
  }, [])

  const t = React.useCallback((key: string) => translate(lang, key), [lang])

  const value: I18nContextValue = React.useMemo(
    () => ({
      lang,
      setLang,
      t,
      languages: LANGUAGES,
    }),
    [lang, setLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return ctx
}

