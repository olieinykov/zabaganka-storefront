import { HttpTypes } from "@medusajs/types"

export type PostomatLimits = {
  max_weight_kg: number
  max_length_cm: number
  max_width_cm: number
  max_height_cm: number
  default_item_weight_kg: number
  default_item_dimension_cm: number
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export async function fetchPostomatLimits(): Promise<PostomatLimits> {
  const res = await fetch(
    `${BACKEND_URL}/store/delivery/nova-poshta/postomat-limits`,
    { cache: "no-store" }
  )
  if (!res.ok) {
    throw new Error(`Failed to load postomat limits (${res.status})`)
  }
  return res.json()
}

export function estimatesExceedPostomat(
  items: HttpTypes.StoreCartLineItem[] | undefined,
  limits: PostomatLimits
): boolean {
  if (!items?.length) {
    return false
  }

  let totalWeight = 0
  let totalVolume = 0
  let maxLength = 0
  let maxWidth = 0
  let maxHeight = 0

  for (const item of items) {
    const qty = item.quantity || 1
    const variant = item.variant as
      | { weight?: number | null; length?: number | null; width?: number | null; height?: number | null }
      | undefined

    const weight =
      typeof variant?.weight === "number" && variant.weight > 0
        ? variant.weight
        : limits.default_item_weight_kg
    const length =
      typeof variant?.length === "number" && variant.length > 0
        ? variant.length
        : limits.default_item_dimension_cm
    const width =
      typeof variant?.width === "number" && variant.width > 0
        ? variant.width
        : limits.default_item_dimension_cm
    const height =
      typeof variant?.height === "number" && variant.height > 0
        ? variant.height
        : limits.default_item_dimension_cm

    totalWeight += weight * qty
    totalVolume += length * width * height * qty
    maxLength = Math.max(maxLength, length)
    maxWidth = Math.max(maxWidth, width)
    maxHeight = Math.max(maxHeight, height)
  }

  const cubeSide = Math.cbrt(totalVolume)
  const boxLength = Math.max(cubeSide, maxLength)
  const boxWidth = Math.max(cubeSide, maxWidth)
  const boxHeight = Math.max(cubeSide, maxHeight)

  return (
    totalWeight > limits.max_weight_kg ||
    boxLength > limits.max_length_cm ||
    boxWidth > limits.max_width_cm ||
    boxHeight > limits.max_height_cm
  )
}
