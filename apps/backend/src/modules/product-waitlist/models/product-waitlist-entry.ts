import { model } from "@medusajs/framework/utils"

/**
 * A single "notify me when back in stock" registration.
 *
 * Product/variant fields are stored as a snapshot (title, thumbnail,
 * handle, variant title) taken at submission time, so the admin preview
 * and the notification email keep working even if the product is later
 * renamed, its variant changed, or the product removed altogether.
 *
 * `contact_value` is the normalized identity used for de-duplication:
 * lower-cased trimmed email, or the phone in canonical "+380XXXXXXXXX"
 * form. Two entries with the same (product_id, variant_id, contact_value)
 * while both are NOT archived are considered a duplicate signup.
 */
const ProductWaitlistEntry = model.define("product_waitlist_entry", {
  id: model.id().primaryKey(),

  product_id: model.text(),
  product_handle: model.text(),
  product_title: model.text(),
  product_thumbnail: model.text().nullable(),

  variant_id: model.text().nullable(),
  variant_title: model.text().nullable(),

  contact_method: model.enum(["email", "phone"]),
  contact_value: model.text(),
  email: model.text().nullable(),
  phone: model.text().nullable(),

  is_archived: model.boolean().default(false),
  archived_at: model.dateTime().nullable(),
  closed_reason: model
    .enum(["manual", "product_deleted", "variant_deleted"])
    .nullable(),

  notified_at: model.dateTime().nullable(),
  notify_error: model.text().nullable(),
})
  .indexes([
    { on: ["product_id"] },
    { on: ["variant_id"] },
    { on: ["is_archived"] },
    { on: ["closed_reason"] },
    { on: ["contact_value"] },
    { on: ["product_id", "variant_id", "contact_value"] },
  ])

export default ProductWaitlistEntry