import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  refreshPaymentCollectionForCartWorkflow,
  removeShippingMethodFromCartStep,
} from "@medusajs/core-flows"

export type ResetOrphanedCartShippingMethodsInput = {
  cart_id: string
  shipping_method_ids: string[]
}

/**
 * Removes the given shipping methods from a cart, then refreshes the cart's
 * payment collection so that any payment session created against the old
 * total (which included the now-removed shipping cost) gets invalidated too
 * — mirroring what `refreshPaymentCollectionForCartWorkflow` already does
 * automatically whenever `refreshCartItemsWorkflow` runs.
 *
 * This exists because Medusa's own `refreshCartShippingMethodsWorkflow`
 * (which runs as part of every add/update/delete line item request)
 * deliberately skips carts with a *single* shipping method — see
 * "Avoid clearing shipping methods for single-method carts" in
 * `@medusajs/core-flows` `refresh-cart-shipping-methods.ts`. That's fine
 * for the common "the shipping option itself became unavailable" case, but
 * it means a single Nova Poshta/Ukrposhta method silently survives even
 * once the cart it was chosen for has been emptied — see the
 * `reset-checkout-on-empty-cart` subscriber, which calls this workflow only
 * for that specific situation.
 */
export const resetOrphanedCartShippingMethodsWorkflow = createWorkflow(
  "reset-orphaned-cart-shipping-methods",
  (input: ResetOrphanedCartShippingMethodsInput) => {
    removeShippingMethodFromCartStep({
      shipping_method_ids: input.shipping_method_ids,
    })

    refreshPaymentCollectionForCartWorkflow.runAsStep({
      input: { cart_id: input.cart_id },
    })

    return new WorkflowResponse(void 0)
  }
)
