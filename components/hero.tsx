import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-1">🎉</span>
            NEW: Nano Banana Pro is now live
            <ArrowRight className="ml-2 h-3 w-3" />
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            <span className="inline-block">Transform Images with</span>{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Simple Text Prompts
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Experience advanced AI image editing with natural language understanding. Create stunning edits with perfect
            character consistency and scene preservation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Start Editing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              View Examples
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>One-shot editing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖼️</span>
              <span>Multi-image support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <span>Natural language</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
