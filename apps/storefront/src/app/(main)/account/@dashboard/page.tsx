import { notFound } from "next/navigation"

// ACCOUNT FEATURE: the account area is disabled for now, so this page renders
// the 404 page without running any account requests or exposing its metadata.
// To re-enable it, uncomment the original code below and remove the stub
// export at the bottom of this file (see also `account/layout.tsx`).
//
// import { Metadata } from "next"
//
// import Overview from "@modules/account/components/overview"
// import { notFound } from "next/navigation"
// import { retrieveCustomer } from "@lib/data/customer"
// import { listOrders } from "@lib/data/orders"
//
// export const metadata: Metadata = {
//   title: "Account",
//   description: "Overview of your account activity.",
// }
//
// export default async function OverviewTemplate() {
//   const customer = await retrieveCustomer().catch(() => null)
//   const orders = (await listOrders().catch(() => null)) || null
//
//   if (!customer) {
//     notFound()
//   }
//
//   return <Overview customer={customer} orders={orders} />
// }

export default function AccountDisabledPage() {
  notFound()
}
