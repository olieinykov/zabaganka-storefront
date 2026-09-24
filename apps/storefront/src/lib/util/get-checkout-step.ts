import { HttpTypes } from "@medusajs/types"

/**
 * Ordered checkout steps. Order matters: it's used to figure out whether a
 * requested `?step=` is actually reachable given the cart's current state.
 */
export const CHECKOUT_STEPS = [
  "address",
  "delivery",
  "payment",
  "review",
] as const

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

function isPaidByGiftcard(cart: HttpTypes.StoreCart) {
  const gc = (cart as unknown as Record<string, unknown>)?.gift_cards as
    | unknown[]
    | undefined
  return !!(gc && gc.length > 0 && cart.total === 0)
}

/**
 * Returns the furthest checkout step the customer has actually completed
 * enough data for. Anything at or before this step is safe to render;
 * anything after it must not be reachable via a raw `?step=` query param.
 */
export function getCheckoutStep(
  cart: HttpTypes.StoreCart | null | undefined
): CheckoutStep {
  if (!cart) {
    return "address"
  }

  if (
    !cart.shipping_address?.first_name ||
    !cart.shipping_address?.last_name ||
    !cart.email
  ) {
    return "address"
  }

  if ((cart.shipping_methods?.length ?? 0) === 0) {
    return "delivery"
  }

  const hasPendingPaymentSession = cart.payment_collection?.payment_sessions?.some(
    (session) => session.status === "pending"
  )

  if (!hasPendingPaymentSession && !isPaidByGiftcard(cart)) {
    return "payment"
  }

  return "review"
}
