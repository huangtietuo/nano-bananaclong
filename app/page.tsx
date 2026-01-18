import { Hero } from "@/components/hero"
import { Generator } from "@/components/generator"
import { Features } from "@/components/features"
import { Showcase } from "@/components/showcase"
import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { createClient as createServerClient } from "@/lib/supabase/server"

// Server component that fetches user data and passes it to client Header
async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Generator />
      <Features />
      <Showcase />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  )
}
