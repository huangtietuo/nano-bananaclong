import { Header as HeaderClient } from "@/components/header"
import { Footer } from "@/components/footer"
import { Pricing as PricingClient } from "@/components/pricing"
import { createClient as createServerClient } from "@/lib/supabase/server"

async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default async function PricingPage() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  return (
    <main className="min-h-screen">
      <Header />
      <PricingClient user={user} />
      <Footer />
    </main>
  )
}

