export const LINE_ITEM_PACKAGING_KEY = "packaging"
export const PACKAGING_CACHE_TAG = "packaging"

export type PackagingDimensions = {
  length: number
  width: number
  height: number
}

export type LineItemPackaging = PackagingDimensions & {
  variant_id: string
  packaging_id: string
  title: string
  image_url: string | null
  unit_price: number
  base_unit_price: number
}

export type PackagingRecord = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_available: boolean
  created_at?: string | Date
}

export type PackagingVariantRecord = PackagingDimensions & {
  id: string
  price: unknown
  image_url?: string | null
  is_available: boolean
  packaging_id?: string
  packaging?: PackagingRecord | null
}

export type StorePackagingOption = PackagingDimensions & {
  id: string
  packaging_id: string
  title: string
  description: string | null
  image_url: string | null
  price: number
}

export function toAmount(value: unknown): number {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    return Number(value)
  }
  if (value && typeof value === "object") {
    const numeric = (value as { numeric?: unknown }).numeric
    if (typeof numeric === "number") {
      return numeric
    }
    const raw = (value as { value?: unknown }).value
    if (raw !== undefined) {
      return Number(raw)
    }
    return Number(String(value))
  }
  return NaN
}

export function addAmounts(...amounts: number[]): number {
  const cents = amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0)
  return cents / 100
}

export function formatDimensions(dimensions: PackagingDimensions): string {
  return `${dimensions.length} × ${dimensions.width} × ${dimensions.height} см`
}

export function hasPackagingKey(metadata: unknown): boolean {
  return (
    !!metadata &&
    typeof metadata === "object" &&
    Object.prototype.hasOwnProperty.call(metadata, LINE_ITEM_PACKAGING_KEY)
  )
}

export function readLineItemPackaging(
  metadata: Record<string, unknown> | null | undefined
): LineItemPackaging | null {
  const value = metadata?.[LINE_ITEM_PACKAGING_KEY]
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
    length: Number(
      packaging.length ?? (packaging as { depth?: unknown }).depth ?? 0
    ),
    width: Number(packaging.width ?? 0),
    height: Number(packaging.height ?? 0),
    unit_price: toAmount(packaging.unit_price),
    base_unit_price: toAmount(packaging.base_unit_price),
  }
}

export const PRODUCT_PACKAGING_FIELDS = [
  "packaging_variants.*",
  "packaging_variants.packaging.*",
]

function createdAtTime(record: { created_at?: string | Date }): number {
  return record.created_at ? new Date(record.created_at).getTime() : 0
}

export function getOfferedPackagingVariants(product: {
  packaging_variants?: (PackagingVariantRecord | null)[] | null
}): (PackagingVariantRecord & { packaging: PackagingRecord })[] {
  return (product.packaging_variants ?? [])
    .filter(
      (variant): variant is PackagingVariantRecord & { packaging: PackagingRecord } =>
        !!variant?.is_available && !!variant.packaging?.is_available
    )
    .sort(
      (a, b) =>
        createdAtTime(a.packaging) - createdAtTime(b.packaging) ||
        toAmount(a.price) - toAmount(b.price)
    )
}

export function variantImageUrl(variant: {
  image_url?: string | null
  packaging?: { image_url: string | null } | null
}): string | null {
  return variant.image_url || variant.packaging?.image_url || null
}

export function toStorePackagingOption(
  variant: PackagingVariantRecord & { packaging: PackagingRecord }
): StorePackagingOption {
  return {
    id: variant.id,
    packaging_id: variant.packaging.id,
    title: variant.packaging.title,
    description: variant.packaging.description,
    image_url: variantImageUrl(variant),
    length: variant.length,
    width: variant.width,
    height: variant.height,
    price: toAmount(variant.price),
  }
}

export function serializePackagingVariant(variant: PackagingVariantRecord) {
  return {
    id: variant.id,
    packaging_id: variant.packaging_id ?? variant.packaging?.id ?? null,
    length: variant.length,
    width: variant.width,
    height: variant.height,
    price: toAmount(variant.price),
    image_url: variant.image_url ?? null,
    is_available: variant.is_available,
  }
}

export function serializePackaging(
  packaging: PackagingRecord & {
    variants?: (PackagingVariantRecord | null)[] | null
  }
) {
  return {
    id: packaging.id,
    title: packaging.title,
    description: packaging.description,
    image_url: packaging.image_url,
    is_available: packaging.is_available,
    variants: (packaging.variants ?? [])
      .filter((variant): variant is PackagingVariantRecord => !!variant)
      .map((variant) => serializePackagingVariant({ ...variant, packaging_id: packaging.id }))
      .sort((a, b) => a.price - b.price),
  }
}

export type DefaultPackaging = {
  title: string
  description: string | null
  image_url: string | null
}

export const DEFAULT_PACKAGING: DefaultPackaging = {
  title: "Фірмове пакування Zabaganka",
  description: "Включене до кожного замовлення",
  image_url: null,
}

export function serializeDefaultPackaging(
  row: DefaultPackaging | null | undefined
): DefaultPackaging {
  if (!row) {
    return DEFAULT_PACKAGING
  }
  return {
    title: row.title,
    description: row.description,
    image_url: row.image_url,
  }
}
