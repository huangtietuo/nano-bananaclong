'use client'

import Link from "next/link"
import { useI18n } from "@/components/i18n-provider"

export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="border-t border-border/40">
      <div className="container px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🍌</div>
            <span className="text-xl font-bold">Nano Banana</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-primary transition-colors">
              {t("nav.pricing")}
            </Link>
            <Link href="/#generator" className="hover:text-primary transition-colors">
              {t("nav.generator")}
            </Link>
            <Link href="/#showcase" className="hover:text-primary transition-colors">
              {t("nav.showcase")}
            </Link>
            <Link href="/#reviews" className="hover:text-primary transition-colors">
              {t("nav.reviews")}
            </Link>
            <Link href="/#faq" className="hover:text-primary transition-colors">
              {t("nav.faq")}
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm">
          <p className="text-muted-foreground">
            {t("footer.copyright").split("{site}")[0]}
            <Link href="https://nanobananatests.online" className="hover:text-primary">
              nanobananatests.online
            </Link>
            {t("footer.copyright").split("{site}")[1] ?? ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{t("footer.independent")}</p>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-primary">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary">
              {t("footer.termsOfService")}
            </Link>
            <Link href="/refund-policy" className="hover:text-primary">
              {t("footer.refundPolicy")}
            </Link>
            <Link href="/refund-application" className="hover:text-primary">
              {t("footer.refundApplication")}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
