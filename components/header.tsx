'use client'

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GoogleSignInButton } from "./google-sign-in-button"
import { signOut } from "@/lib/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/components/i18n-provider"
import { Languages } from "lucide-react"
import { CreditsButton } from "@/components/credits-button"
import type { Lang } from "@/lib/i18n"

// Define User type
interface User {
  id: string
  email: string
  // Add other user properties as needed
}

// Create a client component for the header UI

export function Header({ initialUser }: { initialUser: User | null }) {
  // User data from server component props
  const [user] = React.useState<User | null>(initialUser)
  const { lang, setLang, t, languages } = useI18n()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-16">
        <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center">
        <Link href="/" className="flex items-center gap-2 justify-self-start shrink-0">
          <div className="text-3xl">🍌</div>
          <span className="text-xl font-bold whitespace-nowrap">{"Nano\u00A0Banana"}</span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-6 justify-self-center">
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.pricing")}
          </Link>
          <Link href="/#generator" className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.generator")}
          </Link>
          <Link href="/#showcase" className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.showcase")}
          </Link>
          <Link href="/#reviews" className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.reviews")}
          </Link>
          <Link href="/#faq" className="text-sm font-medium hover:text-primary transition-colors">
            {t("nav.faq")}
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <div className="hidden md:flex">
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger size="sm" className="h-7 w-[110px] rounded-full bg-muted/40 px-2 text-xs">
                <Languages className="size-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CreditsButton />

          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm">{t("auth.signout")}</Button>
              </form>
            </>
          ) : (
            <GoogleSignInButton />
          )}
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/#generator">{t("cta.startEditing")}</Link>
          </Button>
        </div>
        </div>
      </div>
    </header>
  )
}
