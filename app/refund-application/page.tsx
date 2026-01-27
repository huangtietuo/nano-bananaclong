import { Footer } from "@/components/footer"
import { Header as HeaderClient } from "@/components/header"
import { LegalContent } from "@/components/legal-content"
import { createClient as createServerClient } from "@/lib/supabase/server"

async function Header() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  return <HeaderClient initialUser={user} />
}

export default async function RefundApplicationPage() {
  // 用户提供的退款申请内容
  const refundApplicationContent = `更新日期：2026-1-24
提交申请
How to Request a Refund
1. 	 Contact our support team via email or through our contact form
2. 	 Provide your order number and reason for the refund request
3. 	 Our team will review your request and respond within 2-3 business days

Contact Us
Email: hcblue@nanobananatests.online`
  
  return (
    <main className="min-h-screen">
      <Header />
      <LegalContent
        titleKey="legal.refundApplication.title"
        updatedAt="2026-1-24"
        sections={[
          { titleKey: "legal.refundApplication.section1.title", bodyKeys: [refundApplicationContent] },
        ]}
      />
      <Footer />
    </main>
  )
}