import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signInWithGoogle() {
    "use server"
    const supabaseClient = await createClient()
    const origin = headers().get("origin")
      ?? process.env.NEXT_PUBLIC_SITE_URL
      ?? "http://localhost:3000"
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return
    }

    if (data?.url) {
      redirect(data.url)
    }
  }

  async function signOut() {
    "use server"
    const supabaseClient = await createClient()
    await supabaseClient.auth.signOut()
    redirect("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-3xl">🍌</div>
          <span className="text-xl font-bold">Nano Banana</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="#generator" className="text-sm font-medium hover:text-primary transition-colors">
            Generator
          </Link>
          <Link href="#showcase" className="text-sm font-medium hover:text-primary transition-colors">
            Showcase
          </Link>
          <Link href="#reviews" className="text-sm font-medium hover:text-primary transition-colors">
            Reviews
          </Link>
          <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm">Sign out</Button>
              </form>
            </>
          ) : (
            <form action={signInWithGoogle}>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign in with Google
              </Button>
            </form>
          )}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start Editing
          </Button>
        </div>
      </div>
    </header>
  )
}
