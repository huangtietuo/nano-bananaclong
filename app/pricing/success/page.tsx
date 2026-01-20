import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const checkoutId = typeof searchParams.checkout_id === "string" ? searchParams.checkout_id : null
  const orderId = typeof searchParams.order_id === "string" ? searchParams.order_id : null
  const customerId = typeof searchParams.customer_id === "string" ? searchParams.customer_id : null
  const productId = typeof searchParams.product_id === "string" ? searchParams.product_id : null

  return (
    <main className="min-h-screen">
      <div className="container px-4 py-16">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Payment success</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-muted-foreground">
              Thanks! If your plan is subscription-based, access will update after the webhook is delivered.
            </div>

            <div className="space-y-2 text-sm">
              {checkoutId ? <div>checkout_id: {checkoutId}</div> : null}
              {orderId ? <div>order_id: {orderId}</div> : null}
              {customerId ? <div>customer_id: {customerId}</div> : null}
              {productId ? <div>product_id: {productId}</div> : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">Back to pricing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

