import { MedusaRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Product/variant data is only ever a fallback on the entry itself (used
 * when the product has since been deleted). Everywhere it's displayed or
 * sent in an email, we resolve it live from the Product module here first -
 * so editing a product's title/photo/variant is reflected immediately
 * everywhere, instead of staying stuck at whatever it was when the
 * customer submitted the waitlist form.
 */

export async function fetchProductsByIds(
  req: MedusaRequest,
  productIds: string[]
): Promise<Map<string, any>> {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)))
  if (!uniqueIds.length) {
    return new Map()
  }

  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const products = await productModuleService.listProducts(
    { id: uniqueIds },
    { relations: ["variants", "variants.options"] }
  )

  return new Map(products.map((p: any) => [p.id, p]))
}

export function variantTitleFromProduct(
  product: any,
  variantId: string | null | undefined
): string | null {
  if (!product || !variantId) return null

  const variant = product.variants?.find((v: any) => v.id === variantId)
  if (!variant) return null

  return (
    variant.options?.map((o: any) => o.value).join(" / ") ||
    variant.title ||
    null
  )
}

/**
 * Merges live product/variant data into an entry for API responses. Falls
 * back to the entry's own snapshot fields only when the product (or that
 * specific variant) no longer exists - `product_exists`/`variant_exists`
 * tell the admin UI when it's looking at a fallback so it can flag it.
 */
export function decorateEntry(entry: any, productsById: Map<string, any>) {
  const product = productsById.get(entry.product_id)
  const liveVariantTitle = variantTitleFromProduct(product, entry.variant_id)
  const variantExists = !entry.variant_id || !!liveVariantTitle

  return {
    ...entry,
    product_title: product?.title ?? entry.product_title,
    product_thumbnail: product?.thumbnail ?? entry.product_thumbnail,
    product_handle: product?.handle ?? entry.product_handle,
    variant_title: entry.variant_id
      ? liveVariantTitle ?? entry.variant_title
      : null,
    product_exists: !!product,
    variant_exists: variantExists,
  }
}

export function decorateEntries(entries: any[], productsById: Map<string, any>) {
  return entries.map((entry) => decorateEntry(entry, productsById))
}