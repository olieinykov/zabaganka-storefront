import { MedusaService } from "@medusajs/framework/utils"
import ProductWaitlistEntry from "./models/product-waitlist-entry"

type CreateEntryInput = {
  product_id: string
  product_handle: string
  product_title: string
  product_thumbnail?: string | null
  variant_id?: string | null
  variant_title?: string | null
  contact_method: "email" | "phone"
  contact_value: string
  email?: string | null
  phone?: string | null
}

class ProductWaitlistModuleService extends MedusaService({
  ProductWaitlistEntry,
}) {
  async findActiveDuplicate({
    product_id,
    variant_id,
    contact_value,
  }: {
    product_id: string
    variant_id?: string | null
    contact_value: string
  }) {
    const [existing] = await this.listProductWaitlistEntries({
      product_id,
      variant_id: variant_id ?? null,
      contact_value,
      is_archived: false,
    })

    return existing ?? null
  }

  async createEntry(input: CreateEntryInput) {
    return await this.createProductWaitlistEntries({
      ...input,
      variant_id: input.variant_id ?? null,
      variant_title: input.variant_title ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      is_archived: false,
      archived_at: null,
      closed_reason: null,
      notified_at: null,
      notify_error: null,
    })
  }

  async markNotified(id: string) {
    return await this.updateProductWaitlistEntries({
      id,
      notified_at: new Date(),
      notify_error: null,
    })
  }

  async markNotifyFailed(id: string, error: string) {
    return await this.updateProductWaitlistEntries({
      id,
      notify_error: error,
    })
  }

  async archiveEntry(id: string) {
    return await this.updateProductWaitlistEntries({
      id,
      is_archived: true,
      archived_at: new Date(),
      closed_reason: "manual",
    })
  }

  async autoArchiveForProduct(productId: string) {
    const entries = await this.listProductWaitlistEntries({
      product_id: productId,
      is_archived: false,
    })

    if (!entries.length) {
      return []
    }

    const archived_at = new Date()
    return await this.updateProductWaitlistEntries(
      entries.map((entry) => ({
        id: entry.id,
        is_archived: true,
        archived_at,
        closed_reason: "product_deleted" as const,
      }))
    )
  }

  async archiveEntryAsVariantDeleted(id: string) {
    return await this.updateProductWaitlistEntries({
      id,
      is_archived: true,
      archived_at: new Date(),
      closed_reason: "variant_deleted",
    })
  }

  async healVariantReference(id: string, newVariantId: string) {
    return await this.updateProductWaitlistEntries({
      id,
      variant_id: newVariantId,
    })
  }
}

export default ProductWaitlistModuleService