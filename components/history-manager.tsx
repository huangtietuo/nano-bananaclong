"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Clock, Search, Download, Trash2, Eye, Copy, ImageIcon, Video, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useI18n } from "@/components/i18n-provider"
import { useHistory, type HistoryItem } from "@/hooks/use-history"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/hooks/use-auth"

interface HistoryManagerProps {
  onSelectItem?: (item: HistoryItem) => void
  onNavigateToGenerator?: () => void
}

export function HistoryManager({ onSelectItem, onNavigateToGenerator }: HistoryManagerProps) {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { 
    historyItems, 
    isLoading, 
    error, 
    fetchHistory, 
    deleteFromHistory 
  } = useHistory()
  
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([])
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  // 只有在用户已认证时才加载历史记录
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchHistory()
    }
  }, [isAuthenticated, authLoading, fetchHistory])

  // 筛选逻辑
  useEffect(() => {
    let filtered = [...historyItems]

    // 时间筛选
    if (timeFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
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
      
      filtered = filtered.filter(item => item.createdAt >= filterDate)
    }

    // 类型筛选
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.type === typeFilter)
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }, [historyItems, timeFilter, typeFilter, searchQuery])

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image-edit":
        return <ImageIcon className="w-4 h-4" />
      case "text-to-image":
        return <FileText className="w-4 h-4" />
      case "video-generation":
        return <Video className="w-4 h-4" />
      default:
        return <ImageIcon className="w-4 h-4" />
    }
  }

  // 获取类型标签
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "image-edit":
        return t("history.imageEdit")
      case "text-to-image":
        return t("history.textToImage")
      case "video-generation":
        return t("history.videoGeneration")
      default:
        return type
    }
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}${t("history.minutesAgo")}`
    } else if (hours < 24) {
      return `${hours}${t("history.hoursAgo")}`
    } else {
      return `${days}${t("history.daysAgo")}`
    }
  }

  // 下载文件
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 复制提示词
  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    showToast(t("history.promptCopied"), "success")
  }

  // 删除历史记录
  const handleDelete = async (id: string) => {
    try {
      await deleteFromHistory(id)
      showToast(t("history.historyDeleted"), "success")
    } catch (error) {
      console.error("Failed to delete history item:", error)
      showToast(t("history.deleteFailed"), "error")
    }
  }

  return (
    <div className="space-y-6">
      {/* 筛选器 */}
      {isAuthenticated && (
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("history.filterByTime")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.allTime")}</SelectItem>
              <SelectItem value="today">{t("history.today")}</SelectItem>
              <SelectItem value="week">{t("history.thisWeek")}</SelectItem>
              <SelectItem value="month">{t("history.thisMonth")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t("history.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("history.allTypes")}</SelectItem>
              <SelectItem value="image-edit">{t("history.imageEdit")}</SelectItem>
              <SelectItem value="text-to-image">{t("history.textToImage")}</SelectItem>
              <SelectItem value="video-generation">{t("history.videoGeneration")}</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("history.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button variant="outline" onClick={() => {
            setTimeFilter("all")
            setTypeFilter("all") 
            setSearchQuery("")
          }}>
            {t("history.clearFilters")}
          </Button>
        </div>
      )}

      {/* 历史记录列表 */}
      <Card>
        <CardContent className="p-0">
          {authLoading || isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-6">
              {/* 演示提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-800 font-medium">{t("history.demoMode")}</span>
                </div>
                <p className="text-blue-700 text-sm">
                  {t("history.demoDescription")}
                </p>
              </div>

              {/* 登录提示卡片 */}
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">{t("history.signInToUnlock")}</h4>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {t("history.signInDescription")}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.href = '/auth'}>
                    {t("history.signInNow")}
                  </Button>
                  <Button variant="outline" onClick={onNavigateToGenerator}>
                    {t("history.startGenerating")}
                  </Button>
                </div>
              </div>

              {/* 演示历史记录 */}
              <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">{t("history.featureDemo")}</h4>
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg bg-muted/30 opacity-75">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-400 to-pink-400"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t("history.textToImage")}</Badge>
                          <Badge variant="outline" className="text-xs">1 {t("history.credits")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">A majestic dragon flying over a medieval castle...</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-muted/30 opacity-75">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-400 to-cyan-400"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t("history.imageEdit")}</Badge>
                          <Badge variant="outline" className="text-xs">6 {t("history.credits")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Transform the scene into a cyberpunk theme...</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30 opacity-75">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t("history.videoGeneration")}</Badge>
                          <Badge variant="outline" className="text-xs">30 {t("history.credits")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">A cat steals a fish from a supermarket...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="text-destructive mb-4">{t("history.loadingFailed")}</div>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchHistory()}>{t("history.retry")}</Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">
                {searchQuery || timeFilter !== "all" || typeFilter !== "all" 
                  ? t("history.noMatchingRecords")
                  : t("history.noHistoryYet")
                }
              </h4>
              <p className="text-muted-foreground mb-4">
                {searchQuery || timeFilter !== "all" || typeFilter !== "all"
                  ? t("history.tryAdjustingFilters")
                  : t("history.noContentGenerated")
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* 表头 */}
              <div className="bg-muted/50 p-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm">
                  <div className="col-span-3">{t("history.generatedContent")}</div>
                  <div className="col-span-4">{t("history.prompt")}</div>
                  <div className="col-span-2">{t("history.typeModel")}</div>
                  <div className="col-span-2">{t("history.time")}</div>
                  <div className="col-span-1 text-right">{t("history.actions")}</div>
                </div>
              </div>
              
              {/* 历史记录项 */}
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* 生成内容预览 */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {item.type === "video-generation" ? (
                            <Video className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <img 
                              src={item.outputUrls[0]} 
                              alt="Generated content"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          )}
                          <ImageIcon className="w-6 h-6 text-muted-foreground hidden" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.outputUrls.length} {t("history.files")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.credits} {t("history.credits")}
                            </Badge>
                          </div>
                          {item.aspectRatio && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.aspectRatio}
                              {item.resolution && ` • ${item.resolution}`}
                              {item.duration && ` • ${item.duration}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 提示词 */}
                    <div className="col-span-4">
                      <p className="text-sm line-clamp-2 text-foreground">
                        {item.prompt}
                      </p>
                    </div>
                    
                    {/* 类型和模型 */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.model}</p>
                    </div>
                    
                    {/* 时间 */}
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        {formatTime(item.createdAt)}
                      </p>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="col-span-1 flex justify-end">
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(item)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>{t("history.historyDetails")}</DialogTitle>
                            </DialogHeader>
                            {selectedItem && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-medium mb-2">{t("history.generatedContent")}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {selectedItem.outputUrls.map((url, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                                          {selectedItem.type === "video-generation" ? (
                                            <video 
                                              src={url} 
                                              controls 
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <img 
                                              src={url} 
                                              alt={`Generated ${index + 1}`}
                                              className="w-full h-full object-cover"
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">{t("history.prompt")}</h4>
                                      <p className="text-sm bg-muted p-3 rounded-lg">
                                        {selectedItem.prompt}
                                      </p>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-2"
                                        onClick={() => {
                                          handleCopyPrompt(selectedItem.prompt)
                                          if (onSelectItem) {
                                            onSelectItem(selectedItem)
                                          }
                                        }}
                                      >
                                        <Copy className="w-4 h-4 mr-2" />
                                        {t("history.useThisPrompt")}
                                      </Button>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">{t("history.generationInfo")}</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t("history.type")}:</span>
                                          <span>{getTypeLabel(selectedItem.type)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t("history.model")}:</span>
                                          <span>{selectedItem.model}</span>
                                        </div>
                                        {selectedItem.aspectRatio && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("history.aspectRatio")}:</span>
                                            <span>{selectedItem.aspectRatio}</span>
                                          </div>
                                        )}
                                        {selectedItem.resolution && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("history.resolution")}:</span>
                                            <span>{selectedItem.resolution}</span>
                                          </div>
                                        )}
                                        {selectedItem.duration && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t("history.duration")}:</span>
                                            <span>{selectedItem.duration}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t("history.creditsUsed")}:</span>
                                          <span>{selectedItem.credits}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">{t("history.generationTime")}:</span>
                                          <span>{selectedItem.createdAt.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyPrompt(item.prompt)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            item.outputUrls.forEach((url, index) => {
                              const filename = `${item.type}-${item.id}-${index + 1}.${item.type === 'video-generation' ? 'mp4' : 'png'}`
                              handleDownload(url, filename)
                            })
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}