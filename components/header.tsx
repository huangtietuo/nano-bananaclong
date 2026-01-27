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
      <div className="container h-18 px-3">
        <div className="flex h-full items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 justify-self-start shrink-0">
          <div className="text-3xl">🍌</div>
          <span className="text-xl font-bold whitespace-nowrap">{"Nano\u00A0Banana"}</span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-4 justify-self-center flex-1 max-w-[550px]">
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.pricing")}
          </Link>
          <Link href="/#generator" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.generator")}
          </Link>
          <Link href="/video-generator" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.videoGenerator")}
          </Link>
          <Link href="/retrorestore" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.retrorestore")}
          </Link>
          <Link href="/#showcase" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.showcase")}
          </Link>
          <Link href="/#reviews" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.reviews")}
          </Link>
          <Link href="/#faq" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.faq")}
          </Link>
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end shrink-0">
          <div className="hidden md:flex">
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger size="sm" className="h-8 w-[100px] rounded-full bg-muted/40 px-2 text-sm">
                <Languages className="size-4" />
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
              <span className="hidden text-sm text-muted-foreground md:inline max-w-[120px] truncate">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm" className="h-8 px-3 text-sm">{t("auth.signout")}</Button>
              </form>
            </>
          ) : (
            <GoogleSignInButton className="h-8 text-sm" />
          )}
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-sm">
            <Link href="/#generator">{t("cta.startEditing")}</Link>
          </Button>
        </div>
        </div>
      </div>
    </header>
  )
}
