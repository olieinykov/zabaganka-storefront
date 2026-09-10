import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { removeCartItemsForDeletedProductWorkflow } from "../workflows/remove-cart-items-for-deleted-product"

function toIds(data: unknown): string[] {
  const id = (data as { id?: string | string[] } | undefined)?.id
  if (!id) return []
  return Array.isArray(id) ? id : [id]
}

export default async function cartCleanupOnProductRemovedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string | string[] }>) {
  const ids = toIds(event.data)
  if (!ids.length) {
    return
  }

  const input =
    event.name === "product.product-variant.deleted"
      ? { variant_ids: ids }
      : { product_ids: ids }

  await removeCartItemsForDeletedProductWorkflow(container).run({ input })
}

export const config: SubscriberConfig = {
  event: ["product.product.deleted", "product.product-variant.deleted"],
}