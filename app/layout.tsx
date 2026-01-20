import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { I18nProvider } from "@/components/i18n-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nano Banana - AI Image Editor | Transform Photos with Text",
  description:
    "Transform any image with simple text prompts. Experience advanced AI image editing with natural language understanding and character consistency.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      className="tongyi-design-pc" 
      data-theme="light"
      suppressHydrationWarning={true}
    >
      <body className={`${inter.className} antialiased bg-gradient-to-b from-background via-background to-muted/30`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
