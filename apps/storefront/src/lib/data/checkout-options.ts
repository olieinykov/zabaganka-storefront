const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export type PrepaymentSettings = {
  amount: number
  currency_code: string
}


export async function fetchPrepaymentSettings(): Promise<PrepaymentSettings> {
  const res = await fetch(`${BACKEND_URL}/store/checkout-options/prepayment`, {
    headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to load prepayment settings (${res.status})`)
  }
  return res.json()
}
