import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_WAITLIST_MODULE } from "../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../modules/product-waitlist/service"
import { decorateEntries, fetchProductsByIds } from "./utils"

/**
 * GET /admin/product-waitlist
 *
 * Lists ACTIVE (not archived) "notify me" entries - this backs the first
 * section of the "Ожидання на відповідь" admin page. Archived entries never
 * show up here (see /admin/product-waitlist/archived instead), which is
 * also what keeps them out of any count derived from this endpoint.
 *
 * Query params:
 *   - product_id, variant_id, contact_method: exact-match filters
 *   - order: "date_desc" (default, newest first) | "date_asc"
 *   - limit, offset: pagination
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
    order = "date_desc",
    limit = "20",
    offset = "0",
  } = req.query as Record<string, string | undefined>

  const filters: Record<string, unknown> = { is_archived: false }
  if (product_id) filters.product_id = product_id
  if (variant_id) filters.variant_id = variant_id
  if (contact_method) filters.contact_method = contact_method

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