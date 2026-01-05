import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Digital Creator",
    handle: "@AIArtistPro",
    content:
      "This editor completely changed my workflow. The character consistency is incredible - miles ahead of competitors!",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "UGC Specialist",
    handle: "@ContentCreator",
    content:
      "Creating consistent AI influencers has never been easier. It maintains perfect face details across edits!",
    avatar: "MJ",
  },
  {
    name: "Emily Rodriguez",
    role: "Professional Editor",
    handle: "@PhotoEditor",
    content: "One-shot editing is basically solved with this tool. The scene blending is so natural and realistic!",
    avatar: "ER",
  },
]

export function Testimonials() {
  return (
    <section id="reviews" className="py-24 border-b border-border/40">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <span className="mr-1">💬</span>
            User Reviews
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Creators Are Saying</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators transforming their workflow with Nano Banana
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
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
