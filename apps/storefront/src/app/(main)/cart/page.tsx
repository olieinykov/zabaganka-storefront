import { retrieveCart } from "@lib/data/cart"
// ACCOUNT FEATURE: customer retrieval, disabled while there is no account area.
// import { retrieveCustomer } from "@lib/data/customer"
import CartAvailabilityGuard from "@modules/cart/components/cart-availability-guard"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Кошик",
  description: "Переглянути ваш кошик",
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  // ACCOUNT FEATURE: restore and pass `customer` to CartTemplate below.
  // const customer = await retrieveCustomer()

  return (
    <>
      <CartAvailabilityGuard />
      <CartTemplate cart={cart} customer={null} />
    </>
  )
}
