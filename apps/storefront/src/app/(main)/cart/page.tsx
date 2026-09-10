import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
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

  const customer = await retrieveCustomer()

  return (
    <>
      <CartAvailabilityGuard />
      <CartTemplate cart={cart} customer={customer} />
    </>
  )
}