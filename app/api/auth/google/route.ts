import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("Google sign in API route called")
  
  // 检查环境变量
  console.log("Environment variables:")
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing")
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing")
  console.log("NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL ? "Set" : "Missing")
  
  const supabase = createClient()
  
  // 使用正确的 origin
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const redirectTo = `${origin}/auth/callback`
  
  console.log("Generated redirectTo URL:", redirectTo)
  
  try {
    console.log("Calling supabase.auth.signInWithOAuth...")
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // 跳过浏览器重定向，因为我们会在客户端处理
        skipBrowserRedirect: true,
      },
    })
    
    console.log("signInWithOAuth response:")
    console.log("Data:", data)
    console.log("Error:", error)
    
    if (error) {
      console.error("Error in Google sign in API:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (data?.url) {
      console.log("Google sign in URL generated:", data.url)
      // 返回 URL 而不是直接重定向
      return NextResponse.json({ url: data.url }, { status: 200 })
    }
    
    const noUrlError = "No URL returned from Supabase"
    console.error(noUrlError)
    return NextResponse.json({ error: noUrlError }, { status: 500 })
  } catch (e) {
    console.error("Unexpected error in Google sign in API:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}