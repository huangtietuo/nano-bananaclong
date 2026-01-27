// Server Component - This will be rendered on the server
import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { createClient as createServerClient } from "@/lib/supabase/server"
import VideoGeneratorClient from "./client"

// Server component that fetches user data and passes it to client Header
async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

// Main page component (Server Component)
export default async function VideoGeneratorPage() {
  return (
    <main className="min-h-screen">
      <Header />
      {/* Use the client component for the interactive parts */}
      <VideoGeneratorClient />
      <Footer />
    </main>
  )
}
