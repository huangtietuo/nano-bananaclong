"use client"

import { useState, useEffect, useCallback } from "react"

export interface HistoryItem {
  id: string
  type: "image-edit" | "text-to-image" | "video-generation"
  prompt: string
  model: string
  aspectRatio?: string
  resolution?: string
  duration?: string
  outputUrls: string[]
  createdAt: Date
  credits: number
  status: "completed" | "processing" | "failed"
}

export interface HistoryFilters {
  timeFilter: string
  typeFilter: string
  searchQuery: string
}

export function useHistory() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取历史记录
  const fetchHistory = useCallback(async (filters?: Partial<HistoryFilters>) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        type: filters?.typeFilter || "all",
        timeFilter: filters?.timeFilter || "all",
        search: filters?.searchQuery || "",
        limit: "50",
        offset: "0"
      })
      
      const response = await fetch(`/api/history?${params}`)
      
      if (response.status === 401) {
        // 用户未登录，设置空数组
        setHistoryItems([])
        return
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      const formattedData = result.data?.map((item: any) => ({
        ...item,
        createdAt: new Date(item.created_at),
        outputUrls: item.output_urls,
        aspectRatio: item.aspect_ratio
      })) || []
      
      setHistoryItems(formattedData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("Failed to fetch history:", err)
      setHistoryItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 保存历史记录
  const saveToHistory = useCallback(async (item: Omit<HistoryItem, "id" | "createdAt">) => {
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: item.type,
          prompt: item.prompt,
          model: item.model,
          aspectRatio: item.aspectRatio,
          resolution: item.resolution,
          duration: item.duration,
          outputUrls: item.outputUrls,
          credits: item.credits,
          status: item.status
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save to history")
      }

      const result = await response.json()
      const newItem = {
        ...result.data,
        createdAt: new Date(result.data.created_at),
        outputUrls: result.data.output_urls,
        aspectRatio: result.data.aspect_ratio
      }

      // 添加到本地状态
      setHistoryItems(prev => [newItem, ...prev])
      
      return newItem
    } catch (err) {
      console.error("Failed to save to history:", err)
      throw err
    }
  }, [])

  // 删除历史记录
  const deleteFromHistory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete history item")
      }

      // 从本地状态中移除
      setHistoryItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error("Failed to delete history item:", err)
      throw err
    }
  }, [])

  // 初始加载 - 移除自动加载，由组件控制
  // useEffect(() => {
  //   fetchHistory()
  // }, [fetchHistory])

  return {
    historyItems,
    isLoading,
    error,
    fetchHistory,
    saveToHistory,
    deleteFromHistory,
    refetch: () => fetchHistory()
  }
}