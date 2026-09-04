import type { SubscriberConfig } from "@medusajs/framework"
import { notifyStorefrontRevalidate } from "../lib/notify-storefront-revalidate"


export default async function productCacheRevalidateHandler() {
  await notifyStorefrontRevalidate("products")
}

export const config: SubscriberConfig = {
  event: [
    // Core product module (real event strings from @medusajs/utils
    // ProductEvents — note the "product.<entity>.<action>" shape, e.g.
    // "product.product.updated", not "product.updated")
    "product.product.updated",
    "product.product.created",
    "product.product.deleted",
    "product.product.restored",
    "product.product.attached",
    "product.product.detached",
    "product.product-variant.updated",
    "product.product-variant.created",
    "product.product-variant.deleted",
    "product.product-variant.restored",
    "product.product-image.updated",
    "product.product-image.created",
    "product.product-image.deleted",
    // Category/collection attachment can change what shows up on
    // category/collection listing pages
    "product.product-category.updated",
    "product.product-collection.updated",
    // Pricing module — this is what fires for a plain "edit this
    // variant's price" action in Admin
    "pricing.price.updated",
    "pricing.price.created",
    "pricing.price.deleted",
    "pricing.price-set.updated",
    // Inventory — stock level changes (in/out of stock badges, quantity)
    "inventory.inventory-item.updated",
    "inventory.inventory-level.updated",
    "inventory.inventory-level.created",
    "inventory.inventory-level.deleted",
  ],
}
