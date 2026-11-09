export type PackagingDimensions = {
  length: number
  width: number
  height: number
}

/**
 * A paid packaging variant offered for a product: the packaging (name,
 * description, photo) in one size, with its surcharge per piece (UAH).
 */
export type PackagingOption = PackagingDimensions & {
  /** Packaging variant id. */
  id: string
  packaging_id: string
  title: string
  description: string | null
  image_url: string | null
  price: number
}

/**
 * Packaging stored on a cart/order line by the backend. The line's unit
 * price already includes `unit_price`; `base_unit_price` is the jewelry
 * price alone.
 */
export type LineItemPackaging = PackagingDimensions & {
  variant_id: string
  packaging_id: string
  title: string
  image_url: string | null
  unit_price: number
  base_unit_price: number
}

/** The free branded packaging, edited in the admin ("Пакування" page). */
export type DefaultPackaging = {
  title: string
  description: string | null
  image_url: string | null
}

/** Fallback when the packaging API can't be reached. */
export const DEFAULT_PACKAGING: DefaultPackaging = {
  title: "Фірмове пакування Zabaganka",
  description: "Включене до кожного замовлення",
  image_url: null,
}

export type PackagingData = {
  defaultPackaging: DefaultPackaging
  /** Paid packaging variants offered per product id. */
  byProduct: Record<string, PackagingOption[]>
}

/** "10 × 8 × 5 см" — length × width × height, like product dimensions. */
export function formatDimensions(dimensions: PackagingDimensions): string {
  return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} см`
}

export function getLineItemPackaging(item: {
  metadata?: Record<string, unknown> | null
}): LineItemPackaging | null {
  const value = item.metadata?.packaging
  if (!value || typeof value !== "object") {
    return null
  }

  const packaging = value as Partial<LineItemPackaging>
  if (typeof packaging.variant_id !== "string" || !packaging.variant_id) {
    return null
  }

  return {
    variant_id: packaging.variant_id,
    packaging_id: String(packaging.packaging_id ?? ""),
    title: String(packaging.title ?? ""),
    image_url: packaging.image_url ?? null,
    // `depth` is the old name of `length` in lines saved before the rename.
    length: Number(
      packaging.length ?? (packaging as { depth?: unknown }).depth ?? 0
    ),
    width: Number(packaging.width ?? 0),
    height: Number(packaging.height ?? 0),
    unit_price: Number(packaging.unit_price ?? 0),
    base_unit_price: Number(packaging.base_unit_price ?? 0),
  }
}

/** Money sum without binary float noise (prices have at most 2 decimals). */
export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0) / 100
}
