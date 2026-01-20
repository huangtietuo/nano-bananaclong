'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/components/i18n-provider"

const showcases = [
  {
    title: "Ultra-Fast Mountain Generation",
    time: "0.8 seconds",
    image: "/mountain-landscape-with-dramatic-sky.jpg",
  },
  {
    title: "Instant Garden Creation",
    time: "0.9 seconds",
    image: "/beautiful-garden-with-flowers-and-pathways.jpg",
  },
  {
    title: "Real-time Beach Synthesis",
    time: "0.7 seconds",
    image: "/tropical-beach-clear-water.png",
  },
  {
    title: "Rapid Aurora Generation",
    time: "0.8 seconds",
    image: "/northern-lights-aurora-over-snowy-landscape.jpg",
  },
]

export function Showcase() {
  const { t } = useI18n()
  return (
    <section id="showcase" className="py-24 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-1">⚡</span>
            {t("showcase.badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("showcase.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("showcase.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-12">
          {showcases.map((showcase, index) => (
            <Card
              key={index}
              className="overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-lg"
            >
              <div className="relative">
                <img
                  src={showcase.image || "/placeholder.svg"}
                  alt={showcase.title}
                  className="w-full h-64 object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground">
                  🍌 Nano Banana Speed
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{showcase.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("showcase.createdIn").replace("{time}", showcase.time)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/#generator">
              {t("showcase.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
