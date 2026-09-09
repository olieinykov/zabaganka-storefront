import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_WAITLIST_MODULE } from "../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../modules/product-waitlist/service"
import { decorateEntries, fetchProductsByIds } from "../utils"

/**
 * GET /admin/product-waitlist/archived
 *
 * Same filters as the active list, plus:
 *   - `closed_by`: "all" (default) | "manual" | "auto" - "manual" means a
 *     manager closed it from the UI; "auto" covers both automatic-closure
 *     reasons (the product or the specific variant was deleted).
 *   - `q`: free-text search over the contact identity (email or phone).
 *
 * Archived entries live only here - they're excluded from
 * /admin/product-waitlist and its counts so they never factor into
 * "demand" analytics for a product.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const waitlistService: ProductWaitlistModuleService = req.scope.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const {
    product_id,
    variant_id,
    contact_method,
    closed_by = "all",
    order = "date_desc",
    limit = "20",
    offset = "0",
    q,
  } = req.query as Record<string, string | undefined>

  const filters: Record<string, unknown> = { is_archived: true }
  if (product_id) filters.product_id = product_id
  if (variant_id) filters.variant_id = variant_id
  if (contact_method) filters.contact_method = contact_method
  if (closed_by === "manual") {
    filters.closed_reason = "manual"
  } else if (closed_by === "auto") {
    filters.closed_reason = { $in: ["product_deleted", "variant_deleted"] }
  }
  if (q) {
    filters.contact_value = { $ilike: `%${q.trim().toLowerCase()}%` }
  }

  const [entries, count] = await waitlistService.listAndCountProductWaitlistEntries(
    filters,
    {
      order: { created_at: order === "date_asc" ? "ASC" : "DESC" },
      take: Math.min(parseInt(limit, 10) || 20, 100),
      skip: parseInt(offset, 10) || 0,
    }
  )

  const productsById = await fetchProductsByIds(
    req,
    entries.map((e) => e.product_id)
  )

  res.json({ entries: decorateEntries(entries, productsById), count })
}