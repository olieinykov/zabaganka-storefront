import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Medusa's `completeCartWorkflow` already copies `cart.metadata` onto the
 * created order at creation time (see `cartToOrder.metadata` in
 * `@medusajs/medusa/core-flows` — packages/core/core-flows/src/cart/workflows/complete-cart.ts).
 * That's the primary mechanism by which the delivery destination selected in
 * checkout (city + Nova Poshta/Ukrposhta warehouse, saved to `cart.metadata`
 * by the storefront) ends up on `order.metadata` as well.
 *
 * This subscriber is a defensive safety net: it re-applies the source cart's
 * metadata onto the order after `order.placed`, so that even if that copy is
 * ever skipped (e.g. edge cases, older Medusa versions, or a value that only
 * gets set on the cart *after* the order was created — like a payment
 * provider webhook running late) the order still ends up with the correct
 * delivery destination data. It's idempotent and cheap, so it's safe to run
 * on every order.
 */
export default async function orderDeliveryMetadataHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderModuleService = container.resolve(Modules.ORDER)

  // The link between an order and the cart it was created from is created by
  // `completeCartWorkflow` (Modules.ORDER <-> Modules.CART remote link).
  const { data: orderCartLinks } = await query.graph({
    entity: "order_cart",
    fields: ["cart_id", "order_id"],
    filters: { order_id: data.id },
  })

  const cartId = orderCartLinks?.[0]?.cart_id
  if (!cartId) {
    return
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })

  const cartMetadata = carts?.[0]?.metadata
  if (!cartMetadata || !Object.keys(cartMetadata).length) {
    return
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "metadata"],
    filters: { id: data.id },
  })

  const order = orders?.[0]
  if (!order) {
    return
  }

  const alreadyInSync = Object.entries(cartMetadata).every(
    ([key, value]) => (order.metadata as Record<string, unknown> | null)?.[key] === value
  )
  if (alreadyInSync) {
    return
  }

  await orderModuleService.updateOrders(order.id, {
    metadata: { ...(order.metadata || {}), ...cartMetadata },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
