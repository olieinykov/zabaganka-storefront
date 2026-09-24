import { isMono } from "@lib/constants"
import { retrieveCart } from "@lib/data/cart"
import { fetchMonoStatus } from "@lib/data/mono"
import { retrieveCustomer } from "@lib/data/customer"
import { CHECKOUT_STEPS, getCheckoutStep } from "@lib/util/get-checkout-step"
import CartAvailabilityGuard from "@modules/cart/components/cart-availability-guard"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Оформлення замовлення",
}

type Props = {
  searchParams: Promise<{ step?: string }>
}

export default async function Checkout({ searchParams }: Props) {
  const cart = await retrieveCart()

  if (!cart || (cart.items?.length ?? 0) === 0) {
    return notFound()
  }

  const monoSession = cart.payment_collection?.payment_sessions?.find((session) =>
    isMono(session.provider_id)
  )
  if (monoSession) {
    const monoStatus = await fetchMonoStatus(monoSession.id).catch(() => null)
    if (
      monoStatus &&
      (monoStatus.ready_to_complete_order || monoStatus.status === "processing")
    ) {
      redirect(
        `/checkout/mono/return?session_id=${encodeURIComponent(monoSession.id)}`
      )
    }
  }

  const customer = await retrieveCustomer()

  // Guard against jumping straight to a later step via the URL (e.g.
  // `?step=delivery` or `?step=payment`) before the cart actually has the
  // data that step depends on. Each step component only *hides itself* once
  // its own step isn't the active one — none of them independently verify
  // that earlier steps were completed, so this has to be enforced here,
  // once, based on the cart's real state.
  const { step } = await searchParams
  const reachableStep = getCheckoutStep(cart)
  const reachableIndex = CHECKOUT_STEPS.indexOf(reachableStep)
  const requestedIndex = CHECKOUT_STEPS.indexOf(step as (typeof CHECKOUT_STEPS)[number])

  if (requestedIndex === -1 || requestedIndex > reachableIndex) {
    redirect(`/checkout?step=${reachableStep}`)
  }

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-16 large:gap-x-24">
      <CartAvailabilityGuard />
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}