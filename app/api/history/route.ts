import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 获取历史记录
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const timeFilter = searchParams.get("timeFilter")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("generation_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // 类型筛选
    if (type && type !== "all") {
      query = query.eq("type", type)
    }

    // 时间筛选
    if (timeFilter && timeFilter !== "all") {
      const now = new Date()
      let filterDate = new Date()
      
      switch (timeFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      query = query.gte("created_at", filterDate.toISOString())
    }

    // 搜索筛选
    if (search) {
      query = query.or(`prompt.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching history:", error)
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 保存历史记录
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      prompt,
      model,
      aspectRatio,
      resolution,
      duration,
      outputUrls,
      credits,
      status = "completed"
    } = body

    const { data, error } = await supabase
      .from("generation_history")
      .insert({
        user_id: user.id,
        type,
        prompt,
        model,
        aspect_ratio: aspectRatio,
        resolution,
        duration,
        output_urls: outputUrls,
        credits,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving history:", error)
      return NextResponse.json({ error: "Failed to save history" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 删除历史记录
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
    }

    const { error } = await supabase
      .from("generation_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id) // 确保只能删除自己的记录

    if (error) {
      console.error("Error deleting history:", error)
      return NextResponse.json({ error: "Failed to delete history" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}