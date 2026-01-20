import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  
  console.log("OAuth callback received at:", request.url)
  console.log("OAuth code:", code)

  if (code) {
    const supabase = await createClient()
    
    try {
      console.log("Exchanging code for session...")
      // exchangeCodeForSession 会自动设置会话 cookies
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Error exchanging code for session:", error)
      } else {
        console.log("Session exchange successful:", data)
      }
    } catch (e) {
      console.error("Unexpected error during session exchange:", e)
    }
  }

  // 重定向到首页
  return NextResponse.redirect(requestUrl.origin)
}