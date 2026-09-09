import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_WAITLIST_MODULE } from "../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../modules/product-waitlist/service"
import { decorateEntry, fetchProductsByIds } from "../utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const waitlistService: ProductWaitlistModuleService = req.scope.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const entry = await waitlistService
    .retrieveProductWaitlistEntry(req.params.id)
    .catch(() => null)

  if (!entry) {
    res.status(404).json({ message: "Заявку не знайдено" })
    return
  }

  const productsById = await fetchProductsByIds(req, [entry.product_id])

  res.json({
    entry: decorateEntry(entry, productsById),
    storefront_url: process.env.STOREFRONT_URL || "",
  })
}