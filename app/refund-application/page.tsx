import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { LegalContent } from "@/components/legal-content"
import { createClient as createServerClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

const legalSourcePath = path.join(process.cwd(), "新建 文本文档 (2).txt")
const refundContactEmail = "hcblue@nanobananatests.online"
const refundContactPhone = "+86 13939081857"

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n")
}

function findHeading(text: string, heading: string) {
  const regex = new RegExp(`(?:^|\\n)${heading}\\s*\\n`)
  const match = regex.exec(text)
  if (!match) {
    return { index: -1, start: -1 }
  }
  return { index: match.index, start: match.index + match[0].length }
}

function extractSection(text: string, heading: string) {
  const current = findHeading(text, heading)
  if (current.start === -1) {
    return ""
  }
  return text.slice(current.start).trim()
}

function extractBetween(text: string, startLabel: string, endLabel: string) {
  const startIndex = text.indexOf(startLabel)
  if (startIndex === -1) {
    return ""
  }
  const afterStart = text.slice(startIndex + startLabel.length)
  const endIndex = afterStart.indexOf(endLabel)
  const section = endIndex === -1 ? afterStart : afterStart.slice(0, endIndex)
  return section.trim()
}

function loadRefundApplicationContent() {
  const text = normalizeText(fs.readFileSync(legalSourcePath, "utf8"))
  const refundPolicy = extractSection(text, "Refund Policy")
  const requestSection = extractBetween(refundPolicy, "How to Request a Refund", "Processing Time")
  const requestContent = requestSection ? `How to Request a Refund\n${requestSection}` : refundPolicy
  return `${requestContent}\n\nContact Us\nEmail: ${refundContactEmail}\nPhone: ${refundContactPhone}`
}

async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default async function RefundApplicationPage() {
  const refundApplicationContent = loadRefundApplicationContent()
  return (
    <main className="min-h-screen">
      <Header />
      <LegalContent
        titleKey="legal.refundApplication.title"
        updatedAt="2024-10-29"
        sections={[
          { titleKey: "legal.refundApplication.section1.title", bodyKeys: [refundApplicationContent] },
        ]}
      />
      <Footer />
    </main>
  )
}

