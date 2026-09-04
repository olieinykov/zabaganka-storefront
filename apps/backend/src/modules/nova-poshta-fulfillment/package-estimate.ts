export type CartItemForSizing = {
  quantity: number
  variant?: {
    weight?: number | null
    length?: number | null
    width?: number | null
    height?: number | null
  } | null
}

export type PackageEstimate = {
  weightKg: number
  lengthCm: number
  widthCm: number
  heightCm: number
  usedFallbackFor: { weight: boolean; dimensions: boolean }
}

export function estimatePackage(
  items: CartItemForSizing[],
  fallback: { weightKg: number; dimensionCm: number }
): PackageEstimate {
  let totalWeight = 0
  let totalVolume = 0
  let maxLength = 0
  let maxWidth = 0
  let maxHeight = 0
  let usedWeightFallback = false
  let usedDimensionFallback = false

  for (const item of items) {
    const qty = item.quantity || 1
    const variant = item.variant

    const weight =
      typeof variant?.weight === "number" && variant.weight > 0
        ? variant.weight / 1000
        : ((usedWeightFallback = true), fallback.weightKg)

    const length =
      typeof variant?.length === "number" && variant.length > 0
        ? variant.length
        : ((usedDimensionFallback = true), fallback.dimensionCm)
    const width =
      typeof variant?.width === "number" && variant.width > 0
        ? variant.width
        : ((usedDimensionFallback = true), fallback.dimensionCm)
    const height =
      typeof variant?.height === "number" && variant.height > 0
        ? variant.height
        : ((usedDimensionFallback = true), fallback.dimensionCm)

    totalWeight += weight * qty
    totalVolume += length * width * height * qty
    maxLength = Math.max(maxLength, length)
    maxWidth = Math.max(maxWidth, width)
    maxHeight = Math.max(maxHeight, height)
  }

  if (!items.length) {
    return {
      weightKg: fallback.weightKg,
      lengthCm: fallback.dimensionCm,
      widthCm: fallback.dimensionCm,
      heightCm: fallback.dimensionCm,
      usedFallbackFor: { weight: true, dimensions: true },
    }
  }

  const cubeSide = Math.cbrt(totalVolume)

  return {
    weightKg: Math.max(totalWeight, 0.1),
    lengthCm: Math.max(cubeSide, maxLength),
    widthCm: Math.max(cubeSide, maxWidth),
    heightCm: Math.max(cubeSide, maxHeight),
    usedFallbackFor: { weight: usedWeightFallback, dimensions: usedDimensionFallback },
  }
}
