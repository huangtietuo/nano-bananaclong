"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 获取当前用户
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          setError(error.message)
        } else {
          setUser(user)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Authentication error")
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  }
}