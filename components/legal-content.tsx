'use client'

import Link from "next/link"
import React from "react"
import { useI18n } from "@/components/i18n-provider"

type Section = {
  titleKey: string
  bodyKeys: string[]
}

export function LegalContent({
  titleKey,
  updatedAt,
  sections,
}: {
  titleKey: string
  updatedAt: string
  sections: Section[]
}) {
  const { t } = useI18n()
  const supportEmail = "hcblue@nanobananatests.online"

  return (
    <div className="container px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t(titleKey)}</h1>
        <div className="mt-2 text-sm text-muted-foreground">{t("legal.updatedAt").replace("{date}", updatedAt)}</div>

        <div className="mt-8 space-y-10">
          {sections.map((s) => (
            <section key={s.titleKey} className="space-y-3">
              <h2 className="text-lg font-semibold">{t(s.titleKey)}</h2>
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                {s.bodyKeys.flatMap((k) => {
                  const value = t(k)
                  const paragraphs = value.split(/\n\n+/)
                  return paragraphs.map((paragraph, index) => {
                    const key = `${k}-${index}`
                    if (paragraph.includes("{email}")) {
                      const [before, after] = paragraph.split("{email}")
                      return (
                        <p key={key} className="whitespace-pre-wrap">
                          {before}
                          <Link className="text-primary hover:underline" href={`mailto:${supportEmail}`}>
                            {supportEmail}
                          </Link>
                          {after ?? ""}
                        </p>
                      )
                    }
                    return (
                      <p key={key} className="whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    )
                  })
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

