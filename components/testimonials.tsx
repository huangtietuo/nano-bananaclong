'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/components/i18n-provider"

const testimonials = [
  {
    name: "Sarah Chen",
    roleKey: "reviews.1.role",
    handle: "@AIArtistPro",
    contentKey: "reviews.1.content",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    roleKey: "reviews.2.role",
    handle: "@ContentCreator",
    contentKey: "reviews.2.content",
    avatar: "MJ",
  },
  {
    name: "Emily Rodriguez",
    roleKey: "reviews.3.role",
    handle: "@PhotoEditor",
    contentKey: "reviews.3.content",
    avatar: "ER",
  },
]

export function Testimonials() {
  const { t } = useI18n()
  return (
    <section id="reviews" className="py-24 border-b border-border/40">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-1">💬</span>
            {t("reviews.badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("reviews.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("reviews.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{t(testimonial.roleKey)}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{t(testimonial.contentKey)}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
