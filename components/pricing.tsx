"use client"

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Crown, Gem, Globe, Loader2 } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type BillingCycle = "monthly" | "yearly"

type User = {
  id: string
  email: string
} | null

type Tier = "basic" | "pro" | "max"

type Plan = {
  id: Tier
  name: string
  description: string
  highlight?: boolean
  prices: Record<
    BillingCycle,
    {
      amount: number
      suffix: string
      note?: string
      originalAmount?: number
    }
  >
  credits: Record<BillingCycle, string>
  features: string[]
  cta: string
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for individuals and light users",
    prices: {
      monthly: { amount: 15, suffix: "/mo" },
      yearly: { amount: 12, suffix: "/mo", note: "$144.00/year" },
    },
    credits: {
      monthly: "200 credits/month",
      yearly: "2400 credits/year",
    },
    features: [
      "100 high-quality images/month",
      "All style templates included",
      "Standard generation speed",
      "Basic customer support",
      "JPG/PNG format downloads",
    ],
    cta: "Subscribe Now",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professional creators and teams",
    highlight: true,
    prices: {
      monthly: { amount: 39, suffix: "/mo" },
      yearly: { amount: 19.5, suffix: "/mo", note: "$234.00/year", originalAmount: 39 },
    },
    credits: {
      monthly: "800 credits/month",
      yearly: "9600 credits/year",
    },
    features: [
      "400 high-quality images/month",
      "All style templates included",
      "Priority generation queue",
      "Priority customer support",
      "JPG/PNG format downloads",
    ],
    cta: "Subscribe Now",
  },
  {
    id: "max",
    name: "Max",
    description: "Designed for large enterprises and professional studios",
    prices: {
      monthly: { amount: 160, suffix: "/mo" },
      yearly: { amount: 80, suffix: "/mo", note: "$960.00/year", originalAmount: 160 },
    },
    credits: {
      monthly: "3600 credits/month",
      yearly: "43200 credits/year",
    },
    features: [
      "1800 high-quality images/month",
      "All style templates included",
      "Fastest generation speed",
      "Dedicated account manager",
      "JPG/PNG format downloads",
    ],
    cta: "Subscribe Now",
  },
]

type CurrencyOption = {
  code: string
  symbol: string
  labelZh: string
}

const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", labelZh: "美元" },
  { code: "CNY", symbol: "¥", labelZh: "人民币" },
  { code: "EUR", symbol: "€", labelZh: "欧元" },
  { code: "JPY", symbol: "¥", labelZh: "日元" },
  { code: "GBP", symbol: "£", labelZh: "英镑" },
  { code: "CAD", symbol: "C$", labelZh: "加拿大元" },
  { code: "SGD", symbol: "S$", labelZh: "新加坡元" },
  { code: "HKD", symbol: "HK$", labelZh: "港元" },
  { code: "INR", symbol: "₹", labelZh: "印度卢比" },
  { code: "BRL", symbol: "R$", labelZh: "巴西雷亚尔" },
  { code: "MXN", symbol: "$", labelZh: "墨西哥比索" },
  { code: "CHF", symbol: "CHF", labelZh: "瑞士法郎" },
  { code: "SEK", symbol: "kr", labelZh: "瑞典克朗" },
  { code: "NOK", symbol: "kr", labelZh: "挪威克朗" },
  { code: "PLN", symbol: "zł", labelZh: "波兰兹罗提" },
  { code: "TRY", symbol: "₺", labelZh: "土耳其里拉" },
  { code: "AED", symbol: "د.إ", labelZh: "阿联酋迪拉姆" },
  { code: "ZAR", symbol: "R", labelZh: "南非兰特" },
]

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount)
  } catch {
    return amount.toFixed(2)
  }
}

function roundForCurrency(amount: number, currency: string) {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: "currency", currency }).formatToParts(amount)
    const decimals = parts.find((p) => p.type === "fraction")?.value?.length ?? 2
    const factor = 10 ** decimals
    return Math.round(amount * factor) / factor
  } catch {
    return Number(amount.toFixed(2))
  }
}

type ExchangeRates = {
  base: string
  date: string
  rates: Record<string, number>
}

export function Pricing({ user }: { user: User }) {
  const { t } = useI18n()
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>("monthly")
  const [loadingTier, setLoadingTier] = React.useState<Tier | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [currency, setCurrency] = React.useState<string>("USD")
  const [rates, setRates] = React.useState<ExchangeRates | null>(null)

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("pricing:currency")
      if (saved) setCurrency(saved)
    } catch {}
  }, [])

  React.useEffect(() => {
    try {
      window.localStorage.setItem("pricing:currency", currency)
    } catch {}
  }, [currency])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/exchange-rates?base=USD", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as ExchangeRates
        if (!cancelled) setRates(data)
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const startCheckout = async (tier: Tier) => {
    try {
      setError(null)
      setLoadingTier(tier)
      const res = await fetch("/api/creem/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, billingCycle, currency }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? "Failed to create checkout")
      if (!data?.url) throw new Error("Missing checkout URL")
      window.location.href = data.url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container px-4">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-6xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {t("pricing.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4">
            <div className="w-full max-w-md text-left">
              <div className="mb-2 text-sm font-medium text-muted-foreground">{t("pricing.currencyLabel")}</div>
              <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                <SelectTrigger className="h-12 w-full rounded-xl border-2 border-primary/60 bg-background px-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={t("pricing.currencyPlaceholder")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.labelZh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as BillingCycle)}>
              <TabsList>
                <TabsTrigger value="monthly">{t("pricing.monthly")}</TabsTrigger>
                <TabsTrigger value="yearly">{t("pricing.yearly")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = plan.prices[billingCycle]
              const fx = currency === "USD" ? 1 : rates?.rates?.[currency] ?? null
              const amountLocal = fx ? roundForCurrency(price.amount * fx, currency) : null
              const originalLocal = price.originalAmount && fx ? roundForCurrency(price.originalAmount * fx, currency) : null
              const yearlyTotalUsd = billingCycle === "yearly" ? price.amount * 12 : null
              const yearlyTotalLocal = yearlyTotalUsd && fx ? roundForCurrency(yearlyTotalUsd * fx, currency) : null
              const isLoading = loadingTier === plan.id
              const accent = plan.id === "pro" ? "border-primary/50 shadow-lg" : "border-border/50"

              return (
                <div key={plan.id} className={plan.id === "pro" ? "relative lg:-mt-6" : "relative"}>
                  {plan.id === "pro" ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  ) : null}

                  <Card className={`h-full overflow-hidden bg-background ${accent}`}>
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-center">
                        {plan.id === "basic" ? (
                          <Gem className="h-6 w-6 text-primary" />
                        ) : plan.id === "pro" ? (
                          <Gem className="h-6 w-6 text-primary" />
                        ) : (
                          <Crown className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <CardTitle className="text-center text-2xl">{plan.name}</CardTitle>
                      <div className="text-center text-xs text-muted-foreground">{plan.description}</div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="text-center">
                        {price.originalAmount ? (
                          <div className="text-sm text-muted-foreground line-through">
                              {originalLocal ? formatCurrency(originalLocal, currency) : `$${price.originalAmount.toFixed(2)}`}
                              {billingCycle === "monthly" ? t("pricing.perMonth") : t("pricing.perMonth")}
                          </div>
                        ) : null}

                        <div className="mt-1 flex items-end justify-center gap-2">
                            <div className="text-5xl font-extrabold tracking-tight">
                              {amountLocal ? formatCurrency(amountLocal, currency) : `$${price.amount.toFixed(2)}`}
                            </div>
                            <div className="pb-2 text-sm text-muted-foreground">
                              {billingCycle === "monthly" ? t("pricing.perMonth") : t("pricing.perMonth")}
                            </div>
                        </div>

                        <div className="mt-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                          {plan.credits[billingCycle]}
                        </div>

                          {billingCycle === "yearly" ? (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {yearlyTotalLocal ? (
                                <>
                                  {formatCurrency(yearlyTotalLocal, currency)}
                                  {t("pricing.perYear")}
                                </>
                              ) : (
                                price.note
                              )}
                            </div>
                          ) : null}
                      </div>

                      <ul className="space-y-3 text-left text-sm">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Button
                        className={plan.id === "pro" ? "w-full bg-primary text-primary-foreground hover:bg-primary/90" : "w-full"}
                        variant={plan.id === "pro" ? "default" : "outline"}
                        onClick={() => startCheckout(plan.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          plan.cta
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )
            })}
          </div>

          {error ? (
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <Alert variant="destructive">
                <AlertTitle>Checkout failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="mx-auto mt-6 max-w-2xl text-sm text-muted-foreground">
            {user?.email ? <span>Signed in as {user.email}</span> : <span>Sign in to attach purchases to your account.</span>}
          </div>
        </div>
      </div>
    </section>
  )
}

