const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export type MonoStatusResponse = {
  status: string
  ready_to_complete_order: boolean
  still_waiting: boolean
  failed: boolean
  failure_reason?: string
  order_id?: string | null
}

export async function fetchMonoStatus(
  sessionId: string
): Promise<MonoStatusResponse> {
  const res = await fetch(
    `${BACKEND_URL}/store/payments/mono/status?session_id=${encodeURIComponent(
      sessionId
    )}`,
    {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
      cache: "no-store",
    }
  )
  if (!res.ok) {
    throw new Error(`Mono status check failed with ${res.status}`)
  }
  return res.json()
}

const PAYABLE_STATUSES = new Set(["created", "processing", "hold"])

export async function isMonoSessionStillPayable(
  sessionId: string
): Promise<boolean> {
  try {
    const { status } = await fetchMonoStatus(sessionId)
    return PAYABLE_STATUSES.has(status)
  } catch {
    return true
  }
}
