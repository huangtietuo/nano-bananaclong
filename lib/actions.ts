'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// 谷歌登录服务器操作
export async function signInWithGoogle() {
  console.log('Google sign in button clicked!')
  
  const supabaseClient = await createClient()
  // 在服务器操作中，使用环境变量获取 origin，避免使用 headers()
  const origin = process.env.NEXT_PUBLIC_SITE_URL
    ?? "http://localhost:3000"
  
  console.log('Origin:', origin)
  
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })
  
  console.log('signInWithOAuth response:', { data, error })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    return
  }
  
  if (data?.url) {
    console.log('Redirecting to:', data.url)
    redirect(data.url)
  }
}

// 登出服务器操作
export async function signOut() {
  const supabaseClient = await createClient()
  await supabaseClient.auth.signOut()
  redirect("/")
}
