import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_WAITLIST_MODULE } from "../../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../../modules/product-waitlist/service"

/**
 * POST /admin/product-waitlist/:id/close
 *
 * Archives the entry rather than deleting it, so it stops showing up in the
 * active list/counts but stays visible (and searchable) in the archive.
 *
 * For email entries we refuse to close until the "back in stock" email has
 * actually been sent successfully (`notified_at` set) - phone entries have
 * no equivalent automated check, so a manager can close those freely once
 * they've made the call.
 */
export async function POST(
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

  if (entry.is_archived) {
    res.status(400).json({ message: "Заявка вже архівована" })
    return
  }

  if (entry.contact_method === "email" && !entry.notified_at) {
    res.status(400).json({
      message:
        "Неможливо закрити заявку: спершу надішліть лист про наявність товару",
    })
    return
  }

  const updated = await waitlistService.archiveEntry(entry.id)
  res.json({ entry: updated })
}
