import type { SubscriberConfig } from "@medusajs/framework"
import { notifyStorefrontRevalidate } from "../lib/notify-storefront-revalidate"


export default async function productOptionsCacheRevalidateHandler() {
  await notifyStorefrontRevalidate("product-options")
}

export const config: SubscriberConfig = {
  event: [
    // Product module event bus (real event strings from @medusajs/utils
    // ProductEvents — "product.<entity>.<action>" shape), same convention
    // as product-cache-revalidate.ts.
    "product.product-option.updated",
    "product.product-option.created",
    "product.product-option.deleted",
    "product.product-option.restored",
    "product.product-option.attached",
    "product.product-option.detached",
    "product.product-option-value.updated",
    "product.product-option-value.created",
    "product.product-option-value.deleted",
    "product.product-option-value.restored",
    "product.product-option-value.attached",
    "product.product-option-value.detached",
  ],
}