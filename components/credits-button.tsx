'use client'

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Coins } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

type CreditsResponse = {
  authenticated: boolean
  plan: string
  credits_remaining: number
  cost_per_generation: number
}

export function CreditsButton() {
  const { t } = useI18n()
  const router = useRouter()
  const [credits, setCredits] = React.useState<number | null>(null)
  const [authenticated, setAuthenticated] = React.useState<boolean>(false)

  const refresh = React.useCallback(async () => {
    const res = await fetch("/api/credits", { cache: "no-store" })
    const data = (await res.json()) as CreditsResponse
    if (typeof data?.credits_remaining === "number") setCredits(data.credits_remaining)
    setAuthenticated(Boolean(data?.authenticated))
  }, [])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  React.useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { credits_remaining?: number } | undefined
      if (typeof detail?.credits_remaining === "number") {
        setCredits(detail.credits_remaining)
      } else {
        refresh()
      }
    }
    window.addEventListener("credits:update", onUpdate)
    return () => window.removeEventListener("credits:update", onUpdate)
  }, [refresh])

  const handleClick = () => {
    if (credits !== null && credits <= 0) {
      window.alert(t("credits.toast.zero"))
      router.push(authenticated ? "/pricing" : "/pricing")
      return
    }
    refresh()
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:inline-flex h-7 w-[110px] justify-between gap-2 rounded-full bg-muted/40 px-2 text-xs hover:bg-muted/60"
      onClick={handleClick}
    >
      <Coins className="h-3.5 w-3.5" />
      {t("credits.label")}: {credits === null ? "--" : credits}
    </Button>
  )
}

