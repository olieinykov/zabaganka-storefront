import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { resetOrphanedCartShippingMethodsWorkflow } from "../workflows/reset-orphaned-cart-shipping-methods"

/**
 * Bug this fixes: a customer picks a shipping method (and, on the delivery
 * step, a Nova Poshta/Ukrposhta city + warehouse) and gets a payment session
 * initiated, then goes back to the cart and removes every item — but
 * `/checkout` still treats the cart as fully "checked out" (payment step or
 * even review reachable) because the cart still has that one shipping
 * method attached, letting them place an empty order.
 *
 * Medusa's core `refreshCartShippingMethodsWorkflow` — which runs
 * automatically on every add/update/delete line item request — already
 * removes a shipping method once it's no longer a valid option for the
 * cart, and `refreshPaymentCollectionForCartWorkflow` already deletes stale
 * payment sessions once the cart's total no longer matches what was
 * authorized. But the shipping-method cleanup explicitly skips carts with
 * only *one* shipping method (the normal case here — customers pick a
 * single Nova Poshta/Ukrposhta option), so an emptied cart's shipping
 * method — and by extension its payment session/checkout progress — never
 * actually gets cleared on its own.
 *
 * This subscriber closes that gap: whenever a cart changes, if none of its
 * remaining items require shipping (most commonly: it has no items at all)
 * but it still has a shipping method attached, drop it. Removing the
 * shipping method changes the cart's total, which makes the existing
 * `refreshPaymentCollectionForCartWorkflow` call (run as part of the same
 * workflow here) delete the now-stale payment session too — so the
 * customer is sent back to the delivery step, not straight to
 * payment/review, the next time they open `/checkout`. It also clears our
 * own `metadata.delivery` (city/warehouse), since it's tied to the removed
 * shipping method and would otherwise linger unused until overwritten by a
 * fresh delivery selection.
 */
export default async function resetCheckoutOnEmptyCartHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "metadata",
        "items.id",
        "items.requires_shipping",
        "shipping_methods.id",
      ],
      filters: { id: data.id },
    })

    const cart = carts?.[0]
    if (!cart) {
      return
    }

    const shippingMethodIds = (cart.shipping_methods ?? []).map((sm: any) => sm.id)
    if (!shippingMethodIds.length) {
      return
    }

    const stillNeedsShipping = (cart.items ?? []).some(
      (item: any) => item.requires_shipping
    )
    if (stillNeedsShipping) {
      return
    }

    await resetOrphanedCartShippingMethodsWorkflow(container).run({
      input: { cart_id: cart.id, shipping_method_ids: shippingMethodIds },
    })

    const metadata = (cart.metadata ?? {}) as Record<string, unknown>
    if ("delivery" in metadata) {
      const cartModuleService = container.resolve(Modules.CART)
      const { delivery: _delivery, ...restMetadata } = metadata
      await cartModuleService.updateCarts(cart.id, { metadata: restMetadata })
    }
  } catch (err) {
    logger.warn(
      `Не вдалося скинути застарілий спосіб доставки для кошика ${data.id}: ${err}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
}
