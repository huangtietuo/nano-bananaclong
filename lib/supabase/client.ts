import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Only create browser client in client-side context
  if (typeof window === 'undefined') {
    // Return a minimal client with no cookies support for SSR
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithOAuth: async () => ({ data: null, error: null }),
        signOut: async () => ({ error: null }),
      },
      // Add other minimal implementations if needed
    } as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          // Use document.cookie parsing for better compatibility
          const cookies: Array<{ name: string; value: string }> = []
          if (document.cookie) {
            document.cookie.split(';').forEach(cookie => {
              const [name, value] = cookie.trim().split('=')
              if (name && value) {
                cookies.push({ name, value: decodeURIComponent(value) })
              }
            })
          }
          return cookies
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieStr = `${name}=${encodeURIComponent(value)}; path=/`
            if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`
            if (options.secure) cookieStr += '; secure'
            if (options.httpOnly) cookieStr += '; httpOnly'
            if (options.sameSite) cookieStr += `; sameSite=${options.sameSite}`
            document.cookie = cookieStr
          })
        },
      },
    },
  )
}
