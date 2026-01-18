import { Hero } from "@/components/hero"
import { Generator } from "@/components/generator"
import { Features } from "@/components/features"
import { Showcase } from "@/components/showcase"
import { Testimonials } from "@/components/testimonials"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// 处理 OAuth 回调，无论是发送到 / 还是 /auth/callback
async function handleOAuthCallback(code: string | null) {
  if (code) {
    const supabaseServer = await createServerClient()
    
    try {
      console.log("处理根路径上的 OAuth 回调，code:", code)
      const { data, error } = await supabaseServer.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Error exchanging code for session:", error)
      } else {
        console.log("Session exchange successful:", data)
      }
    } catch (e) {
      console.error("Unexpected error during session exchange:", e)
    }
  }
}

// Server component that fetches user data and passes it to client Header
async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default async function Home({ searchParams }: { searchParams: { code?: string } }) {
  // 如果 URL 中有 code 参数，处理 OAuth 回调
  if (searchParams.code) {
    await handleOAuthCallback(searchParams.code)
    // 重定向到同一个页面，但移除 code 参数，避免重复处理
    redirect("/")
  }

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
