"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Coins, Upload, ImageIcon, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/components/i18n-provider"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("")
  const [outputImages, setOutputImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotaOpen, setQuotaOpen] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<{ credits: number; need: number; upgradeUrl: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const reportError = (message: string) => {
    setError(message)
    window.alert(message)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      
      if (file.size > 10 * 1024 * 1024) {
        reportError("Image too large. Please upload an image smaller than 10MB.")
        return
      }
      
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
          setUploadedImage(compressedDataUrl)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    setError(null)

    if (!uploadedImage) {
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
          image: uploadedImage,
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
          const need = typeof payload?.cost_per_generation === "number" ? payload.cost_per_generation : 2
          const upgradeUrl = (payload?.upgrade_url as string | undefined) ?? "/pricing"
          setQuotaInfo({ credits, need, upgradeUrl })
          setQuotaOpen(true)
          return
        }
        throw new Error(payload?.error ?? `API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[Generator] API response:", data)
      const creditsRemaining = (data as any)?._meta?.credits_remaining
      if (typeof creditsRemaining === "number") {
        window.dispatchEvent(new CustomEvent("credits:update", { detail: { credits_remaining: creditsRemaining } }))
      }
      const images = extractImageUrls(data)
      console.log("[Generator] extracted images:", images)

      if (!images.length) {
        throw new Error("No image returned from the API.")
      }

      setOutputImages(images)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate image."
      reportError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section id="generator" className="py-24 bg-muted/30">
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

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("generator.transformTitle")}</CardTitle>
              <CardDescription>{t("generator.transformDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label htmlFor="image-upload">{t("generator.referenceImage")}</Label>
                <div className="mt-2">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    {uploadedImage ? (
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">{t("generator.clickToUpload")}</span> {t("generator.dragDrop")}
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 10MB)</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("generator.addImage")}
                  </Button>
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <Label htmlFor="prompt">{t("generator.promptLabel")}</Label>
                <Textarea
                  id="prompt"
                  placeholder={t("generator.promptPlaceholder")}
                  className="mt-2 min-h-32"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? t("generator.generating") : t("generator.generate")}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Output Gallery</CardTitle>
              <CardDescription>Your ultra-fast AI creations appear here instantly</CardDescription>
            </CardHeader>
            <CardContent>
              {outputImages.length ? (
                <div className="flex flex-col gap-4">
                  {outputImages.map((imageUrl, index) => (
                    <div
                      key={`${imageUrl}-${index}`}
                      className="w-full border border-border rounded-lg overflow-hidden bg-muted/30"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Generated ${index + 1}`} 
                        className="w-full h-auto object-contain" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-[400px] border-2 border-dashed border-border rounded-lg bg-muted/30">
                  <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {isGenerating ? "Generating your image..." : "Ready for instant generation"}
                  </p>
                  <p className="text-xs text-muted-foreground">Enter your prompt and unleash the power</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
