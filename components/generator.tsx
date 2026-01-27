"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Coins, Upload, ImageIcon, Sparkles, FileText, Video, Clock, Database } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/components/i18n-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { HistoryManager } from "@/components/history-manager"
import { useHistory } from "@/hooks/use-history"

const handleDownloadImage = (imageUrl: string, index: number) => {
  const link = document.createElement('a')
  link.href = imageUrl
  
  if (imageUrl.startsWith('data:')) {
    const timestamp = new Date().getTime()
    link.download = `generated-image-${index + 1}-${timestamp}.png`
  } else {
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1] || `generated-image-${index + 1}.png`
    link.download = fileName
  }
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 定义生成器功能板块类型
type GeneratorSection = "image-edit" | "text-to-image" | "video-generation" | "history" | "assets";

// 定义视频生成类型
type VideoGenerationType = "image-to-video" | "text-to-video";

function extractImageUrls(data: unknown): string[] {
  const urls: string[] = []
  const typedData = data as {
    data?: Array<{ url?: string }>
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; image_url?: { url?: string } }>
      }
    }>
  }

  if (Array.isArray(typedData?.data)) {
    typedData.data.forEach((item) => {
      if (item?.url) {
        urls.push(item.url)
      }
    })
  }

  const content = typedData?.choices?.[0]?.message?.content
  if (typeof content === "string") {
    const markdownImageRegex = /!\[.*?\]\((data:image\/[a-z]+;base64,[^)]+)\)/g
    let match
    while ((match = markdownImageRegex.exec(content)) !== null) {
      urls.push(match[1])
    }
  } else if (Array.isArray(content)) {
    content.forEach((item) => {
      if (item?.type === "image_url" && item?.image_url?.url) {
        urls.push(item.image_url.url)
      }
    })
  }

  return urls
}

export function Generator() {
  const { t } = useI18n()
  const router = useRouter()
  const { saveToHistory } = useHistory()
  const [currentSection, setCurrentSection] = useState<GeneratorSection>("image-edit")
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const [outputImages, setOutputImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotaOpen, setQuotaOpen] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("nano-banana")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("1:1")
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [isImageUploadVisible, setIsImageUploadVisible] = useState<boolean>(false)
  const [quotaInfo, setQuotaInfo] = useState<{ credits: number; need: number; upgradeUrl: string } | null>(null)
  
  // 视频生成相关状态
  const [videoType, setVideoType] = useState<VideoGenerationType>("image-to-video")
  const [selectedVideoModel, setSelectedVideoModel] = useState<string>("VEO 3.1")
  const [selectedResolution, setSelectedResolution] = useState<string>("720p")
  const [selectedVideoAspectRatio, setSelectedVideoAspectRatio] = useState<string>("16:9")
  const [selectedDuration, setSelectedDuration] = useState<string>("8s")
  const [autoGenerateAudio, setAutoGenerateAudio] = useState<boolean>(true)
  const [imagePrompt, setImagePrompt] = useState("")
  const [videoPrompt, setVideoPrompt] = useState("")
  const [outputVideos, setOutputVideos] = useState<string[]>([])
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  
  // 视频生成专用的图片上传状态
  const [uploadedVideoImage, setUploadedVideoImage] = useState<string | null>(null)
  const [uploadedEndFrame, setUploadedEndFrame] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const videoPromptRef = useRef<HTMLTextAreaElement | null>(null)
  const videoImageInputRef = useRef<HTMLInputElement | null>(null)
  const endFrameInputRef = useRef<HTMLInputElement | null>(null)
  
  // 功能板块配置
  const sections = [
    { id: "image-edit" as GeneratorSection, title: t("generator.sections.imageEditTitle"), icon: <ImageIcon className="w-5 h-5" />, description: t("generator.sections.imageEditDesc") },
    { id: "text-to-image" as GeneratorSection, title: t("generator.sections.textToImageTitle"), icon: <FileText className="w-5 h-5" />, description: t("generator.sections.textToImageDesc") },
    { id: "video-generation" as GeneratorSection, title: t("generator.sections.videoGenerationTitle"), icon: <Video className="w-5 h-5" />, description: t("generator.sections.videoGenerationDesc"), new: true },
    { id: "history" as GeneratorSection, title: t("generator.sections.historyTitle"), icon: <Clock className="w-5 h-5" />, description: t("generator.sections.historyDesc") },
    { id: "assets" as GeneratorSection, title: t("generator.sections.assetsTitle"), icon: <Database className="w-5 h-5" />, description: t("generator.sections.assetsDesc") },
  ]
  
  // 模型配置
  const models = [
    { id: "nano-banana", name: "Nano Banana", credits: { "image-edit": 2, "text-to-image": 1 } },
    { id: "nano-banana-pro", name: "Nano Banana Pro", credits: { "image-edit": 6, "text-to-image": 6 } },
    { id: "seedream-4", name: "SeeDream 4", credits: { "image-edit": 6, "text-to-image": 6 }, proOnly: true }
  ]
  
  // 获取当前模型所需积分
  const getCurrentCredits = () => {
    const model = models.find(m => m.id === selectedModel)
    if (!model) return 2
    
    // 视频生成有不同的积分计算
    if (currentSection === "video-generation") {
      // 这里可以根据视频参数计算积分
      return 30 // 默认视频积分
    }
    
    return model.credits[currentSection as keyof typeof model.credits] || 2
  }

  const reportError = (message: string) => {
    setError(message)
    window.alert(message)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // 最多允许上传9张图片
    const remainingSlots = 9 - uploadedImages.length
    const filesToProcess = files.slice(0, remainingSlots)
    
    if (files.length > remainingSlots) {
      reportError(`最多只能上传9张图片。已上传 ${uploadedImages.length} 张，本次只能上传 ${remainingSlots} 张。`)
      return
    }
    
    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        reportError("Image too large. Please upload an image smaller than 10MB.")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const maxSize = 1024
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setUploadedImages(prev => [...prev, compressedDataUrl])
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  // 视频生成专用的图片上传处理
  const handleVideoImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        reportError("Image too large. Please upload an image smaller than 10MB.")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const maxSize = 1024
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setUploadedVideoImage(compressedDataUrl)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  // 触发视频图片文件选择器
  const triggerVideoImageInput = () => {
    videoImageInputRef.current?.click()
  }

  // 删除视频上传的图片
  const handleDeleteVideoImage = () => {
    setUploadedVideoImage(null)
  }

  // 结束帧图片上传处理
  const handleEndFrameUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        reportError("Image too large. Please upload an image smaller than 10MB.")
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const maxSize = 1024
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height
              height = maxSize
            }
          }
          
          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setUploadedEndFrame(compressedDataUrl)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  // 触发结束帧文件选择器
  const triggerEndFrameInput = () => {
    endFrameInputRef.current?.click()
  }

  // 删除结束帧图片
  const handleDeleteEndFrame = () => {
    setUploadedEndFrame(null)
  }

  // 定义提示词类型
type PromptItem = {
    id: number;
    type: string; // text-to-image 或 image-to-image
    style: string;
    prompt: string;
  };

  // 1. 深度优化的纯英文分类词库
  const promptLib = {
    // 文生图 (Text-to-Image / 1积分)
    "text": [
      "A majestic dragon flying over a medieval castle, sunset, epic fantasy art, 8k.",
      "Futuristic nanotechnology city, golden hour lighting, cinematic atmosphere, hyper-detailed.",
      "Studio Ghibli style, peaceful cottage in a flower meadow, fluffy clouds, nostalgic vibe.",
      "Cyberpunk street market at night, neon signs, reflections on wet pavement, hyper-detailed.",
      "An astronaut sitting on a giant floating jellyfish in a galaxy of flowers, ethereal atmosphere.",
      "Close-up portrait of a weathered Viking warrior with glowing blue eyes, snow falling, 8k realistic."
    ],
    // 图像编辑 (Image-to-Image / 2积分)
    "edit": [
      "Transform the scene into a cyberpunk theme with neon lights and rainy reflections.",
      "Change the background to a snowy mountain landscape with dramatic polar lights.",
      "Redraw the subject in a Van Gogh oil painting style, thick brushstrokes, vibrant colors.",
      "Apply a high-detail pixel art filter to the entire image, keeping the original composition.",
      "Add a futuristic sci-fi armor to the character while preserving original face features.",
      "Convert this photo into a masterpiece watercolor painting, soft edges, artistic textures."
    ]
  };

  // 风格修饰词
  const styleModifiers = [
    "", ", Ghibli style", ", macro photography", ", steampunk", ", watercolor", ", pixel art", ", vintage photography", ", oil painting", ", cyberpunk", ", fantasy"
  ];

  // 画质补丁
  const qualityPatch = ", masterpiece, highly detailed, 8k";

  // 打字机效果状态
  const [isTyping, setIsTyping] = useState(false);
  const [typeTimer, setTypeTimer] = useState<NodeJS.Timeout | null>(null);

  // 打字机效果函数
  const typeWriter = (text: string, speed = 20) => {
    setIsTyping(true); // 设置打字状态
    setPrompt(""); // 先清空

    // 清除正在运行的定时器
    if (typeTimer) {
      clearInterval(typeTimer);
      setTypeTimer(null);
    }

    let i = 0;

    const timer = setInterval(() => {
      if (i < text.length) {
        setPrompt(prev => prev + text.charAt(i));
        i++;
        // 自动滚动到文本末尾
        if (promptRef.current) {
          promptRef.current.scrollTop = promptRef.current.scrollHeight;
        }
      } else {
        clearInterval(timer);
        setIsTyping(false); // 打字完成，恢复状态
        setTypeTimer(null); // 清除定时器引用
        // 最终聚焦到输入框
        promptRef.current?.focus();
      }
    }, speed);

    setTypeTimer(timer);
  };

  // 随机提示词生成函数
  const handleRandom = () => {
    // 根据当前功能板块选择词库
    const mode = currentSection === "image-edit" ? "edit" : "text";
    const pool = promptLib[mode] || promptLib["text"];
    
    // 随机抓取一个词
    const randomText = pool[Math.floor(Math.random() * pool.length)];
    
    // 随机添加一个风格修饰词
    const randomModifier = styleModifiers[Math.floor(Math.random() * styleModifiers.length)];
    
    // 组合成最终的随机提示词
    const finalPrompt = `${randomText}${randomModifier}${qualityPatch}`;
    
    // 执行打字机效果
    typeWriter(finalPrompt, 20);
  };

  const handleGenerate = async () => {
    setError(null)

    if (currentSection === "image-edit" && uploadedImages.length === 0) {
      reportError(t("generator.needImage"))
      return
    }

    if (!prompt.trim()) {
      reportError(t("generator.needPrompt"))
      return
    }

    setIsGenerating(true)
    setOutputImages([])

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image: currentSection === "image-edit" ? uploadedImages[0] : undefined, // 只有图生图才发送图片
          model: selectedModel,
          cost: getCurrentCredits(),
          section: currentSection, // 添加功能板块信息，让后端能够区分文生图和图生图
          aspectRatio: selectedAspectRatio // 添加纵横比参数
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const code = payload?.code as string | undefined
        if (response.status === 401 && code === "signin_required") {
          throw new Error(t("generator.signinFirst"))
        }
        if (response.status === 402 && code === "quota_exceeded") {
          const credits = typeof payload?.credits_remaining === "number" ? payload.credits_remaining : 0
          const need = typeof payload?.cost_per_generation === "number" ? payload.cost_per_generation : getCurrentCredits()
          const upgradeUrl = (payload?.upgrade_url as string | undefined) ?? "/pricing"
          setQuotaInfo({ credits, need, upgradeUrl })
          setQuotaOpen(true)
          return
        }
        throw new Error(payload?.error ?? `API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      // console.log("[Generator] API response:", data)
      const creditsRemaining = (data as any)?._meta?.credits_remaining
      if (typeof creditsRemaining === "number") {
        window.dispatchEvent(new CustomEvent("credits:update", { detail: { credits_remaining: creditsRemaining } }))
      }
      const images = extractImageUrls(data)
      // console.log("[Generator] extracted images:", images)

      if (!images.length) {
        throw new Error("No image returned from the API.")
      }

      setOutputImages(images)
      
      // 保存到历史记录
      try {
        // 只为图像生成保存历史记录
        if (currentSection === "image-edit" || currentSection === "text-to-image") {
          await saveToHistory({
            type: currentSection,
            prompt,
            model: selectedModel,
            aspectRatio: selectedAspectRatio,
            outputUrls: images,
            credits: getCurrentCredits(),
            status: "completed"
          })
        }
      } catch (error) {
        console.error("Failed to save to history:", error)
        // 不影响主要功能，只是记录错误
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate image."
      reportError(message)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 移除图片
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // 清除所有内容并重置状态
  const handleClear = () => {
    // 清空文本内容
    setPrompt("")
    
    // 重置模型选择为默认值
    setSelectedModel("nano-banana")
    
    // 重置纵横比为默认值
    setSelectedAspectRatio("1:1")
    
    // 清空已上传图片
    setUploadedImages([])
    
    // 清空生成结果
    setOutputImages([])
    
    // 隐藏图片上传区域
    setIsImageUploadVisible(false)
    
    // 自动聚焦到提示词输入框，提升用户体验
    promptRef.current?.focus()
  }
  
  // 处理模型选择
  const handleModelSelect = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model?.proOnly) {
      // 显示升级弹窗
      setUpgradeModalOpen(true)
    } else {
      setSelectedModel(modelId)
    }
  }

  // 添加自定义模型选择器的样式
  const style = `
    /* 1. 核心样式 - 打造高阶感 */
    :root {
      --primary-orange: #f3a022;
      --border-black: #000000;
      --bg-white: #ffffff;
    }

    .model-selector-wrapper {
      position: relative;
      width: 100%;
      max-width: 280px; /* 限制最大宽度，缩短到一半 */
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    }

    /* 模拟截图里的黑边框触发框 */
    .custom-select-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border: 2px solid var(--border-black); /* 粗黑边框 */
      border-radius: 12px;
      background: var(--bg-white);
      cursor: pointer;
      user-select: none;
      z-index: 1000;
    }

    .selected-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* 图标样式 */
    .icon-img {
      width: 18px;
      height: 18px;
      vertical-align: middle;
      margin-right: 8px;
    }
    .icon-star {
      color: #f3a022;
      font-size: 18px;
      vertical-align: middle;
      margin-right: 8px;
    }

    /* 下拉弹窗容器 */
    .options-dropdown {
      display: none !important;
      position: absolute;
      bottom: 100%; /* 向上弹出 */
      left: 0;
      width: 100%;
      background: white;
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border: 1px solid #eee;
      overflow: hidden;
      z-index: 999;
      margin-bottom: 5px;
    }

    .options-dropdown.active {
      display: block !important;
    }

    /* 单个选项 */
    .option-item {
      display: flex;
      align-items: center;
      padding: 12px 14px;
      gap: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .option-item:hover {
      background: #f7f7f7;
    }

    /* Pro 标签样式 */
    .pro-badge {
      background: linear-gradient(90deg, #f3a022, #fdbb2d);
      color: white;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: bold;
      margin-left: auto;
    }
  `;

  // 组件挂载后添加样式
  useEffect(() => {
    // 添加样式到head
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    document.head.appendChild(styleElement);

    // 清理函数
    return () => {
      // 移除样式
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <section id="generator" className="py-24">
      <Dialog open={quotaOpen} onOpenChange={setQuotaOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-0 overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold">{t("quota.title")}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-muted/40 px-5 py-4 flex items-center justify-between">
              <div className="text-muted-foreground">{t("quota.current")}</div>
              <div className="text-lg font-semibold">
                {quotaInfo?.credits ?? 0}{" "}
                <span className="text-muted-foreground text-base">
                  / {t("quota.need").replace("{need}", String(quotaInfo?.need ?? 2))}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/60 dark:bg-amber-500/10 px-5 py-4 border border-amber-200/60 dark:border-amber-500/20">
              <div className="font-semibold mb-3">{t("quota.upgradeTitle")}</div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Coins className="h-4 w-4" />
                  </span>
                  <span>{t("quota.feature1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span>{t("quota.feature2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4" />
                  </span>
                  <span>{t("quota.feature3")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 pt-2 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              className="rounded-full px-8"
              onClick={() => setQuotaOpen(false)}
            >
              {t("quota.cancel")}
            </Button>
            <Button
              className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setQuotaOpen(false)
                router.push(quotaInfo?.upgradeUrl ?? "/pricing")
              }}
            >
              {t("quota.viewPlan")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            AI Image Editor
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("generator.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("generator.subtitle")}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* New Layout with Sidebar and Main Content */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setCurrentSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          currentSection === section.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="text-muted-foreground">{section.icon}</div>
                        <div className="flex items-center gap-2">
                          <span>{section.title}</span>
                          {section.new && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Header - Only show for non-video sections */}
              {currentSection !== "video-generation" && (
                <div className="mb-6">
                  {/* Section Title and Description */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {sections.find(s => s.id === currentSection)?.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {sections.find(s => s.id === currentSection)?.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Video Generation Section */}
              {currentSection === "video-generation" ? (
                <div className="space-y-6">
                  {/* Video Generation Type Tabs */}
                  <div className="flex gap-2 border-b">
                    <button
                      className={`px-4 py-2 border-b-2 font-medium transition-colors ${videoType === "image-to-video" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setVideoType("image-to-video")}
                    >
                      图像转视频
                    </button>
                    <button
                      className={`px-4 py-2 border-b-2 font-medium transition-colors ${videoType === "text-to-video" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                      onClick={() => setVideoType("text-to-video")}
                    >
                      文本转视频
                    </button>
                  </div>

                  {/* Video Configuration */}
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            {/* First Row: Model + Resolution */}
                            <div className="flex flex-wrap gap-3 items-center">
                              {/* Model Selection */}
                              <div className="flex items-center gap-2">
                                <Select value={selectedVideoModel} onValueChange={setSelectedVideoModel}>
                                  <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select Model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="VEO 3.1">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                          <span>VEO 3.1</span>
                                          <Badge variant="secondary" className="text-xs">Audio</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-6">Cinematic quality video with native audio generation</p>
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="VEO 3.1 Fast">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                          <span>VEO 3.1 Fast</span>
                                          <Badge variant="secondary" className="text-xs">Audio</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground pl-6">High-fidelity video with context-aware audio, faster generation</p>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Resolution */}
                              <div className="flex items-center gap-2">
                                <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder={t("generator.resolution")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="720p">720p</SelectItem>
                                    <SelectItem value="1080p">1080p</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Second Row: Aspect Ratio + Duration + Sound Toggle + Credits */}
                            <div className="flex flex-wrap gap-3 items-center">
                              {/* Aspect Ratio */}
                              <div className="flex items-center gap-2">
                                <Select value={selectedVideoAspectRatio} onValueChange={setSelectedVideoAspectRatio}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder={t("generator.ratio")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="16:9">16:9</SelectItem>
                                    <SelectItem value="9:16">9:16</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Duration */}
                              <div className="flex items-center gap-2">
                                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder={t("generator.duration")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="4s">4s</SelectItem>
                                    <SelectItem value="6s">6s</SelectItem>
                                    <SelectItem value="8s">8s</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Audio Control */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  {autoGenerateAudio ? (
                                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.351a5 5 0 010-7.072m2.828 9.9a9 9 0 010-12.728M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                  )}
                                  <span className="text-sm font-medium">{t("generator.autoGenerateAudio")}</span>
                                </div>
                                <button
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out ${autoGenerateAudio ? "bg-primary hover:bg-primary/90" : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"}`}
                                  onClick={() => setAutoGenerateAudio(!autoGenerateAudio)}
                                  aria-label={autoGenerateAudio ? t("generator.disableSound") : t("generator.enableSound")}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${autoGenerateAudio ? "translate-x-6 scale-100" : "translate-x-1 scale-95"}`} />
                                </button>
                              </div>

                              {/* Credits */}
                              <div className="ml-auto bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                {(() => {
                                  const duration = selectedDuration;
                                  const resolution = selectedResolution;
                                  
                                  if (selectedVideoModel === "VEO 3.1") {
                                    // VEO 3.1 积分计算
                                    if (resolution === "720p") {
                                      if (duration === "4s") return "120积分";
                                      if (duration === "6s") return "180积分";
                                      if (duration === "8s") return "240积分";
                                    } else if (resolution === "1080p") {
                                      if (duration === "4s") return "140积分";
                                      if (duration === "6s") return "200积分";
                                      if (duration === "8s") return "260积分";
                                    }
                                    return "60+积分";
                                  } else {
                                    // VEO 3.1 Fast 积分计算
                                    if (resolution === "720p") {
                                      if (duration === "4s") return "15积分";
                                      if (duration === "6s") return "20积分";
                                      if (duration === "8s") return "30积分";
                                    } else if (resolution === "1080p") {
                                      if (duration === "4s") return "20积分";
                                      if (duration === "6s") return "25积分";
                                      if (duration === "8s") return "35积分";
                                    }
                                    return "10+积分";
                                  }
                                })()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                  {/* Video Description and Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Video Description */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold">{t("generator.videoDescription")}</h3>
                            </div>

                            {/* Image Upload Section for Image-to-Video */}
                            {videoType === "image-to-video" && (
                              <div className="mb-4">
                                {/* Hidden file input for video image upload */}
                                <input
                                  type="file"
                                  ref={videoImageInputRef}
                                  onChange={handleVideoImageUpload}
                                  accept="image/*"
                                  className="hidden"
                                />
                                
                                {uploadedVideoImage ? (
                                  // 上传后：图片占据整个空间
                                  <div 
                                    className="w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors relative"
                                    onClick={triggerVideoImageInput}
                                  >
                                    <img 
                                      src={uploadedVideoImage} 
                                      alt="Uploaded video image" 
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    {/* Delete button */}
                                    <button
                                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteVideoImage()
                                      }}
                                      aria-label="Delete image"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                      <Upload className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  // 上传前：显示上传区域和资产库
                                  <div className="flex gap-3">
                                    <div 
                                      className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                                      onClick={triggerVideoImageInput}
                                    >
                                      <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-5 h-5" />
                                      </div>
                                      <span className="text-xs text-muted-foreground">{t("generator.uploadImage")}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-yellow-500 rounded-lg cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors" onClick={() => setCurrentSection("assets")}>
                                      <div className="w-10 h-10 border border-yellow-500 rounded-full flex items-center justify-center mb-2">
                                        <Database className="w-5 h-5 text-yellow-500" />
                                      </div>
                                      <span className="text-xs text-yellow-600 font-medium">{t("generator.assetLibrary")}</span>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-yellow-600 mt-2">{t("generator.required")}</p>
                              </div>
                            )}

                            {/* Video Prompt Input */}
                            <div>
                              <Textarea
                                ref={videoPromptRef}
                                placeholder={t("generator.videoPromptPlaceholder")}
                                className="min-h-24"
                                value={videoPrompt}
                                onChange={(e) => setVideoPrompt(e.target.value)}
                              />
                            </div>

                            {/* Example Prompts */}
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">{t("generator.examplePrompts")}</h4>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">A cat steals a fish from a supermarket and escapes</Badge>
                                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">Time-lapse of flowers blooming in a garden</Badge>
                              </div>
                            </div>

                        {/* Advanced Settings */}
                        <div className="mt-4">
                          <details className="bg-muted/30 rounded-lg p-4">
                            <summary className="flex items-center justify-between gap-2 text-sm font-medium cursor-pointer list-none">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{t("generator.advancedSettings")}</span>
                              </div>
                              <svg className="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="mt-4 space-y-4">
                              {/* Negative Prompt */}
                              <div className="bg-white rounded-lg p-4">
                                <h4 className="font-medium mb-2">{t("generator.negativePrompt")}</h4>
                                <Textarea
                                  placeholder={t("generator.negativePromptPlaceholder")}
                                  className="min-h-16"
                                  // 添加负面提示状态管理
                                />
                              </div>

                              {/* End Frame */}
                              <div className="bg-white rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <h4 className="font-medium">{t("generator.endFrame")}</h4>
                                  <span className="text-xs text-muted-foreground">{t("generator.optional")}</span>
                                </div>
                                {/* Hidden file input for end frame */}
                                <input
                                  type="file"
                                  ref={endFrameInputRef}
                                  onChange={handleEndFrameUpload}
                                  accept="image/*"
                                  className="hidden"
                                />
                                
                                {uploadedEndFrame ? (
                                  // 上传后：图片占据整个空间
                                  <div 
                                    className="w-full min-h-40 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors relative"
                                    onClick={triggerEndFrameInput}
                                  >
                                    <img 
                                      src={uploadedEndFrame} 
                                      alt="Uploaded end frame" 
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    {/* Delete button */}
                                    <button
                                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteEndFrame()
                                      }}
                                      aria-label="Delete end frame"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                      <Upload className="w-8 h-8 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  // 上传前：显示上传区域和资产库
                                  <div className="flex gap-3">
                                    {/* Upload End Frame Image - Larger space */}
                                    <div 
                                      className="flex flex-col items-center justify-center flex-3 min-h-40 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                                      onClick={triggerEndFrameInput}
                                    >
                                      <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-5 h-5" />
                                      </div>
                                      <span className="text-xs text-muted-foreground">{t("generator.uploadEndFrameImage")}</span>
                                    </div>
                                    {/* Asset Library - Smaller space */}
                                    <div className="flex flex-col items-center justify-center flex-1 min-h-40 border-2 border-dashed border-yellow-500 rounded-lg cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors" onClick={() => setCurrentSection("assets")}>
                                      <div className="w-10 h-10 border border-yellow-500 rounded-full flex items-center justify-center mb-2">
                                        <Database className="w-5 h-5 text-yellow-500" />
                                      </div>
                                      <span className="text-xs text-yellow-600 font-medium">Asset Library</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </details>
                        </div>

                        {/* Generate Video Button */}
                        <div className="mt-6">
                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-medium">
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isGeneratingVideo ? t("generator.generating") : t("generator.generate")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Video Preview */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold">{t("generator.videoPreview")}</h3>
                              </div>
                            </div>

                            {/* Preview Area */}
                            <div className="flex flex-col items-center justify-center w-full h-96 border border-border rounded-lg bg-muted/30">
                              <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm font-medium mb-1">{t("generator.noVideoYet")}</p>
                              <p className="text-xs text-muted-foreground">{t("generator.enterDescriptionToStart")}</p>
                            </div>

                            {/* Usage Tips */}
                            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h4 className="text-sm font-medium">{t("generator.usageTips")}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {t("generator.usageTipsContent")}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                  </div>
                </div>
              ) : currentSection === "history" ? (
                <div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{t("generator.sections.historyTitle")}</h3>
                    <p className="text-muted-foreground">{t("generator.sections.historyDesc")}</p>
                  </div>
                  <HistoryManager 
                    onSelectItem={(item) => {
                      // 可以在这里处理选中历史记录项的逻辑
                      // 比如将提示词填入当前生成器
                      setPrompt(item.prompt)
                      setSelectedModel(item.model)
                      if (item.aspectRatio) {
                        setSelectedAspectRatio(item.aspectRatio)
                      }
                      // 切换到对应的生成模式
                      setCurrentSection(item.type)
                    }}
                    onNavigateToGenerator={() => setCurrentSection("image-edit")}
                  />
                </div>
              ) : currentSection === "assets" ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      <div>
                        <h3 className="text-xl font-bold mb-4">{t("assets.title")}</h3>
                        <p className="text-muted-foreground">{t("assets.description")}</p>
                      </div>
                      
                      {/* Assets Actions */}
                      <div className="flex flex-wrap gap-4 justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            {t("assets.uploadAssets")}
                          </Button>
                          <Button variant="outline">
                            <Database className="w-4 h-4 mr-2" />
                            {t("assets.categoryManagement")}
                          </Button>
                        </div>
                        
                        <div className="flex-1 max-w-md">
                          <input
                            type="text"
                            placeholder={t("assets.searchAssets")}
                            className="w-full px-3 py-2 border border-border rounded-md"
                          />
                        </div>
                      </div>
                      
                      {/* Assets Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Empty State */}
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-lg">
                          <Database className="w-12 h-12 text-muted-foreground mb-4" />
                          <h4 className="text-lg font-semibold mb-2">{t("assets.noAssets")}</h4>
                          <p className="text-muted-foreground mb-4">{t("assets.noAssetsDescription")}</p>
                          <Button variant="outline">{t("assets.uploadAssets")}</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Image Generation Section */
                <div>
                  {/* AI Generator Card */}
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      {/* File Input (always in DOM) */}
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                      
                      {/* Image Upload Section */}
                      {(isImageUploadVisible || uploadedImages.length > 0) && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                              {/* AI Image Generator Logo */}
                              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-orange-600">
                                  {t("generator.aiImageGenerator")}
                                </span>
                              </div>
                              <Label>{currentSection === "image-edit" ? t("generator.referenceImage") : t("generator.addImage")}</Label>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (uploadedImages.length === 0) {
                                  setIsImageUploadVisible(!isImageUploadVisible);
                                } else {
                                  fileInputRef.current?.click();
                                }
                              }}
                              className="rounded-full"
                              disabled={uploadedImages.length >= 9}
                            >
                              <Upload className="w-4 h-4 mr-1" />
                              {t("generator.addImage")}
                            </Button>
                          </div>
                          
                          {/* Multiple Image Upload Display */}
                          <div className="flex flex-wrap gap-3 mt-2">
                            {uploadedImages.map((imageUrl, index) => (
                              <div key={index} className="relative w-24 h-24 border border-border rounded-lg overflow-hidden bg-muted/30 group">
                                <img
                                  src={imageUrl}
                                  alt={`Uploaded ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => {
                                    handleRemoveImage(index);
                                    // If no images left, hide the upload area
                                    if (uploadedImages.length - 1 === 0) {
                                      setIsImageUploadVisible(false);
                                    }
                                  }}
                                  className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            
                            {/* Add More Images Button */}
                            {uploadedImages.length < 9 && (
                              <label
                                htmlFor="image-upload"
                                className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                              >
                                <div className="w-6 h-6 border border-border rounded-full flex items-center justify-center">
                                  <span className="text-sm">+</span>
                                </div>
                              </label>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            {uploadedImages.length}/9 {t("generator.imagesUploaded")}
                          </p>
                        </div>
                      )}
                      
                      {/* If no image upload section, show Add Image button inline with logo */}
                      {!isImageUploadVisible && uploadedImages.length === 0 && (
                        <div className="mb-6 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {/* AI Image Generator Logo */}
                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-orange-600">
                                {t("generator.aiImageGenerator")}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-full"
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {t("generator.addImage")}
                          </Button>
                        </div>
                      )}

                      {/* Prompt Input */}
                      <div className="mb-6">
                        <Label htmlFor="prompt">{t("generator.promptLabel")}</Label>
                        <Textarea
                          ref={promptRef}
                          id="prompt"
                          placeholder={currentSection === "image-edit"
                            ? t("generator.promptPlaceholder")
                            : t("generator.promptPlaceholder")
                          }
                          className="mt-2 min-h-24"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                      </div>

                      {/* Aspect Ratio Selection */}
                      <div className="mb-6">
                        <Label>{t("generator.aspectRatio")}</Label>
                        <div className="mt-2 flex gap-2">
                          {["1:1", "16:9", "9:16", "4:3", "3:4"].map((ratio) => (
                            <Button
                              key={ratio}
                              variant="outline"
                              size="sm"
                              className={`rounded-full px-4 py-2 ${
                                ratio === selectedAspectRatio ? "bg-primary text-primary-foreground" : ""
                              }`}
                              onClick={() => setSelectedAspectRatio(ratio)}
                            >
                              {ratio}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Model Selection and Action Buttons - Horizontal Layout */}
                      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Model Selection */}
                        <div className="flex-1 flex flex-col">
                          <Label htmlFor="modelTrigger" className="mb-1">{t("generator.model")}</Label>
                          <div className="model-selector-wrapper">
                            <div className="custom-select-trigger" id="modelTrigger" onClick={(e) => {
                              e.stopPropagation();
                              setIsDropdownOpen(!isDropdownOpen);
                            }}>
                              <div className="selected-content" id="currentDisplay" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {selectedModel === "nano-banana" && (
                                  <>
                                    <img src="https://www.google.com/favicon.ico" className="icon-img" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '8px' }} />
                                    <span style={{ verticalAlign: 'middle' }}>Nano Banana</span>
                                  </>
                                )}
                                {selectedModel === "nano-banana-pro" && (
                                  <>
                                    <img src="https://www.google.com/favicon.ico" className="icon-img" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '8px' }} />
                                    <span style={{ verticalAlign: 'middle' }}>Nano Banana Pro</span>
                                  </>
                                )}
                                {selectedModel === "seedream-4" && (
                                  <>
                                    <span className="icon-star" style={{ fontSize: '18px', color: '#f3a022', verticalAlign: 'middle', marginRight: '8px' }}>★</span>
                                    <span style={{ verticalAlign: 'middle' }}>SeeDream 4</span>
                                  </>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', verticalAlign: 'middle' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                            </div>

                            <div className={`options-dropdown ${isDropdownOpen ? 'active' : ''}`} id="modelList">
                              <div 
                                className={`option-item ${selectedModel === "nano-banana" ? 'selected' : ''}`}
                                data-model="nano-banana"
                                onClick={() => {
                                  handleModelSelect("nano-banana");
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <img src="https://www.google.com/favicon.ico" className="icon-img" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '8px' }} />
                                <span style={{ verticalAlign: 'middle' }}>Nano Banana</span>
                                {selectedModel === "nano-banana" && <span className="check-mark" style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>✓</span>}
                              </div>
                              <div 
                                className={`option-item ${selectedModel === "nano-banana-pro" ? 'selected' : ''}`}
                                data-model="nano-banana-pro"
                                onClick={() => {
                                  handleModelSelect("nano-banana-pro");
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <img src="https://www.google.com/favicon.ico" className="icon-img" style={{ width: '18px', height: '18px', verticalAlign: 'middle', marginRight: '8px' }} />
                                <span style={{ verticalAlign: 'middle' }}>Nano Banana Pro</span>
                                {selectedModel === "nano-banana-pro" && <span className="check-mark" style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>✓</span>}
                              </div>
                              <div 
                                className={`option-item ${selectedModel === "seedream-4" ? 'selected' : ''}`}
                                data-model="seedream-4"
                                onClick={() => {
                                  handleModelSelect("seedream-4");
                                  setIsDropdownOpen(false);
                                }}
                              >
                                <span className="icon-star" style={{ fontSize: '18px', color: '#f3a022', verticalAlign: 'middle', marginRight: '8px' }}>★</span>
                                <span style={{ verticalAlign: 'middle' }}>SeeDream 4</span>
                                <span className="pro-badge">Pro</span>
                                {selectedModel === "seedream-4" && <span className="check-mark" style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>✓</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 items-center">
                          <Button variant="outline" size="sm" className="rounded-full" onClick={handleClear}>
                            {t("generator.clear")}
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-full" onClick={handleRandom}>
                            {t("generator.random")}
                          </Button>
                          <Button
                            className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleGenerate}
                            disabled={isGenerating || isTyping || (currentSection === "image-edit" && uploadedImages.length === 0)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? t("generator.generating") : `${t("generator.generate")} (${getCurrentCredits()} ${t("credits.label")})`}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Upgrade Modal */}
                  <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
                    <DialogContent className="sm:max-w-md">
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="text-xl font-bold">高级 AI 模型</div>
                        </div>
                        <div className="mb-6">
                          <p className="text-muted-foreground mb-4">
                            高级 AI 模型是专业独享功能，提供更强大的图像生成和编辑能力。
                          </p>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-sm">独家高级 AI 模型 - 更强大的生成能力</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-sm">优质输出 - 专业级图像输出</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-sm">优先队列以更快的生成速度</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                              <span className="text-sm">高分辨率输出 - 2K/4K 超高清图像生成</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setUpgradeModalOpen(false)}
                          >
                            也许稍后再说
                          </Button>
                          <Button
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                              setUpgradeModalOpen(false)
                              router.push("/pricing")
                            }}
                          >
                            升级到 Pro
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Output Gallery */}
                  <Card>
                    <CardHeader>
                      <CardTitle>输出结果</CardTitle>
                      <CardDescription>您的AI创作将立即显示在这里</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {outputImages.length ? (
                        <div className="flex flex-col gap-4">
                          {outputImages.map((imageUrl, index) => (
                            <div
                              key={`${imageUrl}-${index}`}
                              className="relative w-full border border-border rounded-lg overflow-hidden bg-muted/30 group"
                            >
                              <img 
                                src={imageUrl} 
                                alt={`Generated ${index + 1}`} 
                                className="w-full h-auto object-contain" 
                              />
                              <button
                                onClick={() => handleDownloadImage(imageUrl, index)}
                                className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                                title="下载图片"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-[400px] border-2 border-dashed border-border rounded-lg bg-muted/30">
                          <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground" />
                          <p className="text-sm font-medium mb-1">
                            {isGenerating ? "生成中..." : "准备生成"}
                          </p>
                          <p className="text-xs text-muted-foreground">输入提示词，释放AI的力量</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}