'use client'

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/components/i18n-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Upload, ImageIcon, Sparkles, Video, Database, Volume2, VolumeX } from "lucide-react"

// 定义视频生成类型
type VideoGenerationType = "image-to-video" | "text-to-video";

// Prompt library data
const promptsLibrary = {
  "text_to_video": [
    {
      "id": "t2v_001",
      "title": "Cyberpunk City",
      "prompt": "Cinematic wide shot, a rainy cyberpunk street at night with neon signs reflecting in deep puddles. A futuristic car glides past the camera. Hyper-realistic, 8k, volumetric lighting."
    },
    {
      "id": "t2v_002",
      "title": "Natural Wonder",
      "prompt": "Breathtaking aerial view of a hidden waterfall in a tropical jungle at sunrise. Mist rises from the water, and birds fly across the frame. Epic scale, cinematic colors."
    },
    {
      "id": "t2v_003",
      "title": "Space Explorer",
      "prompt": "An astronaut walking on the surface of Mars during a dust storm. Red dust swirling around the boots, dramatic lighting, epic cinematic music feel."
    },
    {
      "id": "t2v_004",
      "title": "3D Animation",
      "prompt": "A cute 3D cartoon hamster wearing a tiny space suit, floating inside a colorful spaceship. Soft Pixar-style lighting, high-quality textures, expressive eyes."
    }
  ],
  "image_to_video": [
    {
      "id": "i2v_001",
      "title": "Natural Smile",
      "prompt": "The person in the image slowly looks up, blinks naturally, and gives a warm, subtle smile toward the camera. Soft wind blowing through the hair."
    },
    {
      "id": "i2v_002",
      "title": "Ocean Waves",
      "prompt": "The waves in the sea begin to crash against the shore with realistic foam and water splashes, while the sun in the background sets slowly."
    },
    {
      "id": "i2v_003",
      "title": "Magic Aura",
      "prompt": "The static object in the image starts to glow with a golden aura and slowly floats into the air, surrounded by magical sparkling particles."
    },
    {
      "id": "i2v_004",
      "title": "City Awakening",
      "prompt": "Keep the buildings still, but make the traffic lights flicker and the clouds in the sky move fast like a time-lapse video."
    }
  ]
};

// Client Component for interactive video generation interface
function VideoGeneratorClient() {
  const { t } = useI18n()
  const router = useRouter()
  const [videoType, setVideoType] = useState<VideoGenerationType>("image-to-video")
  const [selectedVideoModel, setSelectedVideoModel] = useState<string>("Veo 3.1 Cinematic (Landscape)")
  const [selectedResolution, setSelectedResolution] = useState<string>("720p")
  const [selectedVideoAspectRatio, setSelectedVideoAspectRatio] = useState<string>("16:9")
  const [selectedDuration, setSelectedDuration] = useState<string>("8s")
  const [autoGenerateAudio, setAutoGenerateAudio] = useState<boolean>(true)
  const [videoPrompt, setVideoPrompt] = useState("")
  const [outputVideos, setOutputVideos] = useState<string[]>([])
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotaOpen, setQuotaOpen] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{ credits: number; need: number; upgradeUrl: string } | null>(null)
  
  // Prompt templates based on video type and model
  const promptTemplates = {
    "text-to-video": {
      "VEO 3.1": "Cinematic [Subject], [Action] in [Environment]. [Camera Angle], [Lighting Style]. Audio: [Specific Sound Effects].",
      "VEO 3.1 Fast": "Dynamic shot of [Subject] [Action]. High energy, [Style]. Audio: [Punchy Sound Effects]."
    },
    "image-to-video": {
      "VEO 3.1": "The [Subject] in the image begins to [Action] smoothly. Maintain consistent visual style from the original image. Audio: [Ambient Sounds].",
      "VEO 3.1 Fast": "Keep the subject still, but let the [Background Elements like clouds/water/fire] move realistically. Audio: [Natural Sounds]."
    }
  }
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const startFrameFileInputRef = useRef<HTMLInputElement | null>(null)
  const endFrameFileInputRef = useRef<HTMLInputElement | null>(null)
  const videoPromptRef = useRef<HTMLTextAreaElement | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedStartFrame, setUploadedStartFrame] = useState<string | null>(null)
  const [uploadedEndFrame, setUploadedEndFrame] = useState<string | null>(null)
  
  const reportError = (message: string) => {
    setError(message)
    window.alert(message)
  }
  
  // 处理图片上传
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 处理结束帧图片上传
  const handleEndFrameUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedEndFrame(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 处理开始帧图片上传
  const handleStartFrameUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedStartFrame(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 触发文件选择器
  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click()
  }
  
  // 删除已上传的图片
  const handleDeleteImage = () => {
    setUploadedImage(null)
  }
  
  // 删除已上传的结束帧图片
  const handleDeleteEndFrame = () => {
    setUploadedEndFrame(null)
  }
  
  // 删除已上传的开始帧图片
  const handleDeleteStartFrame = () => {
    setUploadedStartFrame(null)
  }
  
  // 获取当前模型所需积分
  const getCurrentCredits = () => {
    const duration = selectedDuration;
    const resolution = selectedResolution;
    
    if (selectedVideoModel === "Veo 3.1 Cinematic (Landscape)") {
      // 高质量电影级横屏模型积分计算
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
    } else if (selectedVideoModel === "Veo 3.1 Fast (Portrait)") {
      // 快速竖屏模型积分计算
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
    // 默认返回快速模型积分
    return "10+积分";
  }
  
  // Video generation API call function
  async function generateVideo(modelType, prompt, imageUrl = null) {
    // Enhance prompt with audio generation instructions if enabled
    let enhancedPrompt = prompt;
    if (autoGenerateAudio) {
      enhancedPrompt += " Please automatically generate appropriate ambient sounds or sound effects based on the video content.";
    } else {
      enhancedPrompt += " Please generate this video without any audio.";
    }

    const requestData = {
      model: modelType,
      prompt: enhancedPrompt
    };

    // Add image URL if provided
    if (imageUrl) {
      requestData.image = imageUrl;
    }

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed with status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Success (${modelType}):`, result);
      return result;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  const handleGenerateVideo = async () => {
    setError(null)
    
    if (videoType === "image-to-video" && !uploadedImage) {
      reportError(t("generator.needImage"))
      return
    }
    
    if (!videoPrompt.trim()) {
      reportError(t("generator.needPrompt"))
      return
    }
    
    setIsGeneratingVideo(true)
    setOutputVideos([])
    
    try {
      // Map UI model name to API model name
      const modelMap = {
        "Veo 3.1 Cinematic (Landscape)": "veo3.1-landscape",
        "Veo 3.1 Fast (Portrait)": "veo3.1-portial"
      };
      
      const apiModelType = modelMap[selectedVideoModel] || "veo3.1-landscape";
      
      // Call the API
      const result = await generateVideo(
        apiModelType,
        videoPrompt,
        videoType === "image-to-video" ? uploadedImage : null
      );
      
      // Extract video URL or handle task response from API
      if (result?.choices?.[0]?.message?.content) {
        const content = result.choices[0].message.content;
        console.log("API Response Content:", content);
        
        // Check if response contains task information
        if (content.includes("任务ID:") || content.includes("任务失败")) {
          // Handle task-based response
          if (content.includes("任务失败")) {
            // Task failed, show error message
            const errorMatch = content.match(/❌ 任务失败[\s\S]*?>([^<]+)</);
            const errorMessage = errorMatch ? errorMatch[1] : "视频生成任务失败，请检查提示词后重试。";
            reportError(errorMessage);
          } else {
            // Task created, show task progress information
            reportError("视频生成任务已创建，正在处理中。请稍后查看结果。");
            // In a real application, you would implement polling or WebSocket to get task progress
          }
          setOutputVideos([]);
        } else {
          // Try to extract video URL from response
          const videoUrlMatch = content.match(/(https?:\/\/[^\s\)]+\.(mp4|webm|mov))/i);
          if (videoUrlMatch) {
            const videoUrl = videoUrlMatch[0];
            setOutputVideos([videoUrl]);
          } else {
            // No video URL found
            console.log("No direct video URL found in response:", content);
            reportError("无法从API响应中提取视频URL，请稍后重试。");
            setOutputVideos([]);
          }
        }
      } else {
        reportError("API响应格式不正确，请稍后重试。");
        setOutputVideos([]);
      }
      
      setIsGeneratingVideo(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : t("generator.failedToGenerate");
      
      // Show user-friendly error message
      let userFriendlyMessage = message;
      if (message.includes("model_not_found") || message.includes("无可用渠道")) {
        userFriendlyMessage = t("generator.videoModelNotAvailable") || "当前选择的视频模型不可用，请尝试其他模型或稍后再试。";
      } else if (message.includes("401") || message.includes("unauthorized")) {
        userFriendlyMessage = t("generator.apiAuthError") || "API认证失败，请检查配置。";
      } else if (message.includes("503")) {
        userFriendlyMessage = t("generator.serviceUnavailable") || "视频生成服务暂时不可用，请稍后再试。";
      }
      
      reportError(userFriendlyMessage)
      setIsGeneratingVideo(false)
    }
  }
  
  return (
    <>
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

      <div className="container px-4 mx-auto py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            AI Video Generator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("generator.sections.videoGenerationTitle")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("generator.sections.videoGenerationDesc")}
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Video Generation Section */}
          <div className="space-y-6">
            {/* Video Generation Type Tabs */}
            <div className="flex gap-2 border-b">
              <button
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${videoType === "image-to-video" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setVideoType("image-to-video")}
              >
                {t("generator.imageToVideo")}
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${videoType === "text-to-video" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setVideoType("text-to-video")}
              >
                {t("generator.textToVideo")}
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
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Veo 3.1 Cinematic (Landscape)">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                <span>Veo 3.1 Cinematic (Landscape)</span>
                                <Badge variant="secondary" className="text-xs">16:9</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground pl-6">Best for high-quality movie-style horizontal videos.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="Veo 3.1 Fast (Portrait)">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                                <span>Veo 3.1 Fast (Portrait)</span>
                                <Badge variant="secondary" className="text-xs">9:16</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground pl-6">Best for quick generation of vertical short videos for mobile.</p>
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
                          <Volume2 className="w-4 h-4 text-primary" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-muted-foreground" />
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
                      {getCurrentCredits()}
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
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex gap-3">
                        <div 
                          className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                          onClick={() => triggerFileInput(fileInputRef)}
                        >
                          {uploadedImage ? (
                            <div className="w-full h-full relative">
                              <img 
                                src={uploadedImage} 
                                alt="Uploaded image" 
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {/* Delete button */}
                              <button
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                                onClick={(e) => {
                                  e.stopPropagation(); // 阻止事件冒泡，避免触发文件选择
                                  handleDeleteImage();
                                }}
                                aria-label="Delete image"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Upload className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2">
                                <Upload className="w-5 h-5" />
                              </div>
                              <span className="text-xs text-muted-foreground">{t("generator.uploadImage")}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-yellow-500 rounded-lg cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors">
                          <div className="w-10 h-10 border border-yellow-500 rounded-full flex items-center justify-center mb-2">
                            <Database className="w-5 h-5 text-yellow-500" />
                          </div>
                          <span className="text-xs text-yellow-600 font-medium">{t("generator.assetLibrary")}</span>
                        </div>
                      </div>
                      <p className="text-xs text-yellow-600 mt-2">{t("generator.required")}</p>
                    </div>
                  )}

                  {/* Video Prompt Input with Templates */}
                  <div>
                    {/* Template Selection */}
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{t("generator.videoPrompt")}</h4>
                      <Select
                        defaultValue=""
                        onValueChange={(value) => {
                          setVideoPrompt(value);
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder={t("generator.selectTemplate")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(promptTemplates[videoType]).map(([model, template]) => (
                            <SelectItem key={model} value={template}>
                              {model} Template
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      ref={videoPromptRef}
                      placeholder={t("generator.videoPromptPlaceholder")}
                      className="min-h-24"
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                    />
                  </div>

                  {/* Prompt Library */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">{t("generator.examplePrompts")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {/* Show text-to-video prompts when in text-to-video mode */}
                      {videoType === "text-to-video" && promptsLibrary.text_to_video.map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 max-w-xs text-left whitespace-normal"
                          onClick={() => setVideoPrompt(item.prompt)}
                        >
                          <span className="font-medium block mb-1">{item.title}</span>
                          <span className="text-xs line-clamp-2">{item.prompt}</span>
                        </Badge>
                      ))}
                      
                      {/* Show image-to-video prompts when in image-to-video mode */}
                      {videoType === "image-to-video" && promptsLibrary.image_to_video.map((item) => (
                        <Badge
                          key={item.id}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 max-w-xs text-left whitespace-normal"
                          onClick={() => setVideoPrompt(item.prompt)}
                        >
                          <span className="font-medium block mb-1">{item.title}</span>
                          <span className="text-xs line-clamp-2">{item.prompt}</span>
                        </Badge>
                      ))}
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
                          />
                        </div>

                        {/* Frame Images - Start and End Frames */}
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h4 className="font-medium">{t("generator.frameImages")}</h4>
                            <span className="text-xs text-muted-foreground">{t("generator.optional")}</span>
                          </div>

                          {/* Hidden file inputs */}
                          {videoType === "text-to-video" && (
                            <input
                              type="file"
                              ref={startFrameFileInputRef}
                              onChange={handleStartFrameUpload}
                              accept="image/*"
                              className="hidden"
                            />
                          )}
                          <input
                            type="file"
                            ref={endFrameFileInputRef}
                            onChange={handleEndFrameUpload}
                            accept="image/*"
                            className="hidden"
                          />

                          {/* Start Frame - Only show in Text to Video mode */}
                          {videoType === "text-to-video" && (
                            <div className="mb-4">
                              <h5 className="text-sm font-medium mb-2">{t("generator.startFrame")}</h5>
                              <div className="flex gap-3">
                                {/* Upload Start Frame Image */}
                                <div 
                                  className={`flex flex-col items-center justify-center min-h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors ${uploadedStartFrame ? 'flex-1' : 'flex-3'}`}
                                  onClick={() => triggerFileInput(startFrameFileInputRef)}
                                >
                                  {uploadedStartFrame ? (
                                    <div className="w-full h-full relative">
                                      <img 
                                        src={uploadedStartFrame} 
                                        alt="Uploaded start frame" 
                                        className="w-full h-full object-cover rounded-lg"
                                      />
                                      {/* Delete button */}
                                      <button
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-md"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteStartFrame();
                                        }}
                                        aria-label="Delete start frame"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2">
                                        <Upload className="w-5 h-5" />
                                      </div>
                                      <span className="text-xs text-muted-foreground">{t("generator.uploadStartFrameImage")}</span>
                                    </>
                                  )}
                                </div>
                                {/* Asset Library - Start Frame - Only show when no image uploaded */}
                                {!uploadedStartFrame && (
                                  <div className="flex flex-col items-center justify-center flex-1 min-h-32 border-2 border-dashed border-yellow-500 rounded-lg cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                    <div className="w-10 h-10 border border-yellow-500 rounded-full flex items-center justify-center mb-2">
                                      <Database className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <span className="text-xs text-yellow-600 font-medium">{t("generator.assetLibrary")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* End Frame - Show in both modes */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">{t("generator.endFrame")}</h5>
                            <div className="flex gap-3">
                              {/* Upload End Frame Image */}
                              <div 
                                className={`flex flex-col items-center justify-center min-h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors ${uploadedEndFrame ? 'flex-1' : 'flex-3'}`}
                                onClick={() => triggerFileInput(endFrameFileInputRef)}
                              >
                                {uploadedEndFrame ? (
                                  <div className="w-full h-full relative">
                                    <img 
                                      src={uploadedEndFrame} 
                                      alt="Uploaded end frame" 
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                    {/* Delete button */}
                                    <button
                                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-md"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEndFrame();
                                      }}
                                      aria-label="Delete end frame"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <Upload className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center mb-2">
                                      <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{t("generator.uploadEndFrameImage")}</span>
                                  </>
                                )}
                              </div>
                              {/* Asset Library - End Frame - Only show when no image uploaded */}
                              {!uploadedEndFrame && (
                                <div className="flex flex-col items-center justify-center flex-1 min-h-32 border-2 border-dashed border-yellow-500 rounded-lg cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors">
                                  <div className="w-10 h-10 border border-yellow-500 rounded-full flex items-center justify-center mb-2">
                                    <Database className="w-5 h-5 text-yellow-500" />
                                  </div>
                                  <span className="text-xs text-yellow-600 font-medium">{t("generator.assetLibrary")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* Generate Video Button */}
                  <div className="mt-6">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-medium" onClick={handleGenerateVideo}>
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
                    {outputVideos.length > 0 ? (
                      <video
                        src={outputVideos[0]}
                        controls
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <>
                        <svg className="w-16 h-16 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium mb-1">{t("generator.noVideoYet")}</p>
                        <p className="text-xs text-muted-foreground">{t("generator.enterDescriptionToStart")}</p>
                      </>
                    )}
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
        </div>
      </div>
    </>
  )
}

export default VideoGeneratorClient
