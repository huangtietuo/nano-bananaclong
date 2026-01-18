'use client'

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GoogleSignInButton } from "./google-sign-in-button"

// Define User type
interface User {
  id: string
  email: string
  // Add other user properties as needed
}

// Create a client component for the header UI

export function Header({ initialUser }: { initialUser: User | null }) {
  // User data from server component props
  const [user, setUser] = React.useState<User | null>(initialUser)

  async function signOut() {
    // Use client-side sign out
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
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
            <GoogleSignInButton />
          )}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Start Editing
          </Button>
        </div>
      </div>
    </header>
  )
}
