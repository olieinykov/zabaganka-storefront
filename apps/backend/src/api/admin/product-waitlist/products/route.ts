import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_WAITLIST_MODULE } from "../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../modules/product-waitlist/service"
import { fetchProductsByIds, variantTitleFromProduct } from "../utils"

/**
 * GET /admin/product-waitlist/products
 *
 * Second section of the admin page: one row per product with an active
 * waitlist, total signups, and a per-variant breakdown. Only ACTIVE
 * (non-archived) entries are counted, in line with archived entries never
 * factoring into demand numbers.
 *
 * Product/variant titles and thumbnails are resolved live from the Product
 * module (not the entries' stored snapshot) so renaming a product or its
 * variants shows up here immediately - the snapshot only kicks in as a
 * fallback for a product that's since been deleted.
 *
 * There's no separate "product detail" list endpoint for the paginated
 * people list on that page - the client re-uses GET /admin/product-waitlist
 * with a `product_id` filter for that.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const waitlistService: ProductWaitlistModuleService = req.scope.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const { q, limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >

  const activeEntries = await waitlistService.listProductWaitlistEntries(
    { is_archived: false },
    {
      select: [
        "id",
        "product_id",
        "product_title",
        "product_thumbnail",
        "variant_id",
        "variant_title",
      ],
    }
  )

  const productsById = await fetchProductsByIds(
    req,
    activeEntries.map((e) => e.product_id)
  )

  type Group = {
    product_id: string
    product_title: string
    product_thumbnail: string | null
    product_exists: boolean
    total_count: number
    variants: Map<string, { variant_id: string; variant_title: string | null; count: number }>
  }

  const groups = new Map<string, Group>()

  for (const entry of activeEntries) {
    const liveProduct = productsById.get(entry.product_id)

    let group = groups.get(entry.product_id)
    if (!group) {
      group = {
        product_id: entry.product_id,
        product_title: liveProduct?.title ?? entry.product_title,
        product_thumbnail: liveProduct?.thumbnail ?? entry.product_thumbnail,
        product_exists: !!liveProduct,
        total_count: 0,
        variants: new Map(),
      }
      groups.set(entry.product_id, group)
    }

    group.total_count += 1

    if (entry.variant_id) {
      const liveVariantTitle = variantTitleFromProduct(
        liveProduct,
        entry.variant_id
      )
      const variantEntry = group.variants.get(entry.variant_id) || {
        variant_id: entry.variant_id,
        variant_title: liveVariantTitle ?? entry.variant_title,
        count: 0,
      }
      variantEntry.count += 1
      group.variants.set(entry.variant_id, variantEntry)
    }
  }

  let productGroups = Array.from(groups.values()).map((g) => ({
    product_id: g.product_id,
    product_title: g.product_title,
    product_thumbnail: g.product_thumbnail,
    product_exists: g.product_exists,
    total_count: g.total_count,
    variants: Array.from(g.variants.values()).sort((a, b) => b.count - a.count),
  }))

  if (q) {
    const needle = q.trim().toLowerCase()
    productGroups = productGroups.filter((g) =>
      g.product_title.toLowerCase().includes(needle)
    )
  }

  productGroups.sort((a, b) => b.total_count - a.total_count)

  const count = productGroups.length
  const start = parseInt(offset, 10) || 0
  const take = Math.min(parseInt(limit, 10) || 20, 100)
  const paged = productGroups.slice(start, start + take)

  res.json({ products: paged, count })
}