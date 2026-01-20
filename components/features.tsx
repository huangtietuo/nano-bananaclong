'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Layers, Zap, ImageIcon, Sparkles } from "lucide-react"
import { useI18n } from "@/components/i18n-provider"

const features = [
  {
    icon: MessageSquare,
    titleKey: "features.1.title",
    descriptionKey: "features.1.desc",
  },
  {
    icon: Users,
    titleKey: "features.2.title",
    descriptionKey: "features.2.desc",
  },
  {
    icon: Layers,
    titleKey: "features.3.title",
    descriptionKey: "features.3.desc",
  },
  {
    icon: Zap,
    titleKey: "features.4.title",
    descriptionKey: "features.4.desc",
  },
  {
    icon: ImageIcon,
    titleKey: "features.5.title",
    descriptionKey: "features.5.desc",
  },
  {
    icon: Sparkles,
    titleKey: "features.6.title",
    descriptionKey: "features.6.desc",
  },
]

export function Features() {
  const { t } = useI18n()
  return (
    <section className="py-24 border-b border-border/40">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("features.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{t(feature.descriptionKey)}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
