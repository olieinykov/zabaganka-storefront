import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Resend } from "resend"
import { PRODUCT_WAITLIST_MODULE } from "../../../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../../../modules/product-waitlist/service"
import { waitlistAvailableEmail } from "../../../../../modules/resend/templates/waitlist-available"
import { decorateEntry, fetchProductsByIds } from "../../utils"

/**
 * POST /admin/product-waitlist/:id/notify
 *
 * Sends the "back in stock" email for an email-contact waitlist entry via
 * Resend, called directly here (rather than through the generic
 * notification module) so we get an explicit, unambiguous success/failure
 * result to act on - the admin UI must not allow closing an email entry
 * until this has actually succeeded.
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

  if (entry.contact_method !== "email" || !entry.email) {
    res
      .status(400)
      .json({ message: "У цієї заявки спосіб зв'язку не email" })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const storefrontUrl = process.env.STOREFRONT_URL

  if (!apiKey || !from || !storefrontUrl) {
    const message =
      "Не налаштовано RESEND_API_KEY / RESEND_FROM_EMAIL / STOREFRONT_URL на сервері"
    await waitlistService.markNotifyFailed(entry.id, message)
    res.status(500).json({ message, sent: false })
    return
  }

  const resend = new Resend(apiKey)

  // Resolve live product/variant data so the email always reflects what's
  // actually in the catalog right now, not whatever it was when the
  // customer originally submitted the form.
  const productsById = await fetchProductsByIds(req, [entry.product_id])
  const liveEntry = decorateEntry(entry, productsById)

  const html = waitlistAvailableEmail({
    productTitle: liveEntry.product_title,
    productHandle: liveEntry.product_handle,
    variantTitle: liveEntry.variant_title,
    productThumbnail: liveEntry.product_thumbnail,
    storefrontUrl,
    variantId: entry.variant_id,
  })

  const { data, error } = await resend.emails.send({
    from,
    to: [entry.email],
    subject: "Товар знову в наявності — Zabaganka Boutique",
    html,
  })

  if (error || !data) {
    const message = error?.message || "Невідома помилка сервісу email"
    await waitlistService.markNotifyFailed(entry.id, message)
    res.status(502).json({ message, sent: false })
    return
  }

  const updated = await waitlistService.markNotified(entry.id)
  res.json({ entry: updated, sent: true })
}