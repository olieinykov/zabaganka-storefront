import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_WAITLIST_MODULE } from "../modules/product-waitlist"
import ProductWaitlistModuleService from "../modules/product-waitlist/service"


function toIds(data: unknown): string[] {
  const id = (data as { id?: string | string[] } | undefined)?.id
  if (!id) return []
  return Array.isArray(id) ? id : [id]
}

function combinationSignature(values: (string | undefined | null)[]): string {
  return values
    .filter((v): v is string => !!v)
    .map((v) => v.trim().toLowerCase())
    .sort()
    .join("|")
}


export default async function productWaitlistAutoCloseHandler({
  event,
  container,
}: SubscriberArgs<{ id: string | string[] }>) {
  const waitlistService: ProductWaitlistModuleService = container.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const ids = toIds(event.data)
  if (!ids.length) {
    return
  }

  if (event.name === "product.product.deleted") {
    for (const productId of ids) {
      await waitlistService.autoArchiveForProduct(productId)
    }
    return
  }

  if (event.name !== "product.product-variant.deleted") {
    return
  }

  const productModuleService = container.resolve(Modules.PRODUCT)

  for (const variantId of ids) {
    const entries = await waitlistService.listProductWaitlistEntries({
      variant_id: variantId,
      is_archived: false,
    })

    if (!entries.length) {
      continue
    }

    for (const entry of entries) {
      const product = await productModuleService
        .retrieveProduct(entry.product_id, {
          relations: ["variants", "variants.options"],
        })
        .catch(() => null)

      if (!product) {
        continue
      }

      const targetSignature = combinationSignature(
        (entry.variant_title || "").split(" / ")
      )

      const stillAvailable = product.variants?.find(
        (v: any) =>
          combinationSignature((v.options || []).map((o: any) => o.value)) ===
          targetSignature
      )

      if (stillAvailable) {
        if (stillAvailable.id !== entry.variant_id) {
          await waitlistService.healVariantReference(entry.id, stillAvailable.id)
        }
        continue
      }

      await waitlistService.archiveEntryAsVariantDeleted(entry.id)
    }
  }
}

export const config: SubscriberConfig = {
  event: ["product.product.deleted", "product.product-variant.deleted"],
}