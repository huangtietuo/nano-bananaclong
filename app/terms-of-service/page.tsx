import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { LegalContent } from "@/components/legal-content"
import { createClient as createServerClient } from "@/lib/supabase/server"
import fs from "fs"
import path from "path"

const legalSourcePath = path.join(process.cwd(), "新建 文本文档 (2).txt")

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

function extractSection(text: string, heading: string, nextHeading: string) {
  const current = findHeading(text, heading)
  const next = findHeading(text, nextHeading)
  if (current.start === -1) {
    return ""
  }
  const endIndex = next.index === -1 ? text.length : next.index
  return text.slice(current.start, endIndex).trim()
}

function loadTermsContent() {
  const text = normalizeText(fs.readFileSync(legalSourcePath, "utf8"))
  return extractSection(text, "Terms of Service", "Refund Policy")
}

async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default async function TermsOfServicePage() {
  const termsContent = loadTermsContent()
  return (
    <main className="min-h-screen">
      <Header />
      <LegalContent
        titleKey="legal.terms.title"
        updatedAt="2024-10-29"
        sections={[
          { titleKey: "legal.terms.section1.title", bodyKeys: [termsContent] },
        ]}
      />
      <Footer />
    </main>
  )
}

