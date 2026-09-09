import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_WAITLIST_MODULE } from "../../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../../modules/product-waitlist/service"
import { variantTitleFromProduct } from "../../utils"

/**
 * GET /admin/product-waitlist/products/:product_id
 *
 * Product detail for section 2: live product + variants (so the manager
 * can see the full product, not just the waitlist snapshot), the active
 * signup total, and a per-variant breakdown. The paginated list of people
 * is fetched by the client separately via
 * GET /admin/product-waitlist?product_id=...&limit=10&offset=...
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { product_id } = req.params

  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const product = await productModuleService
    .retrieveProduct(product_id, {
      relations: ["variants", "variants.options", "images"],
    })
    .catch(() => null)

  const waitlistService: ProductWaitlistModuleService = req.scope.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const activeEntries = await waitlistService.listProductWaitlistEntries(
    { product_id, is_archived: false },
    { select: ["id", "variant_id", "variant_title"] }
  )

  const variantCounts = new Map<
    string,
    { variant_id: string; variant_title: string | null; count: number }
  >()

  for (const entry of activeEntries) {
    if (!entry.variant_id) continue
    const existing = variantCounts.get(entry.variant_id) || {
      variant_id: entry.variant_id,
      variant_title:
        variantTitleFromProduct(product, entry.variant_id) ??
        entry.variant_title,
      count: 0,
    }
    existing.count += 1
    variantCounts.set(entry.variant_id, existing)
  }

  if (!product && activeEntries.length === 0) {
    res.status(404).json({ message: "Товар не знайдено" })
    return
  }

  res.json({
    product: product || null,
    total_count: activeEntries.length,
    variants: Array.from(variantCounts.values()).sort(
      (a, b) => b.count - a.count
    ),
  })
}