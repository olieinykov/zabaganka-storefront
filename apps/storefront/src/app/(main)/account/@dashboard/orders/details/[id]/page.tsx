import { notFound } from "next/navigation"

// ACCOUNT FEATURE: the account area is disabled for now, so this page renders
// the 404 page without running any account requests or exposing its metadata.
// To re-enable it, uncomment the original code below and remove the stub
// export at the bottom of this file (see also `account/layout.tsx`).
//
// import { retrieveOrder } from "@lib/data/orders"
// import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
// import { Metadata } from "next"
// import { notFound } from "next/navigation"
//
// type Props = {
//   params: Promise<{ id: string }>
// }
//
// export async function generateMetadata(props: Props): Promise<Metadata> {
//   const params = await props.params
//   const order = await retrieveOrder(params.id).catch(() => null)
//
//   if (!order) {
//     notFound()
//   }
//
//   return {
//     title: `Order #${order.display_id}`,
//     description: `View your order`,
//   }
// }
//
// export default async function OrderDetailPage(props: Props) {
//   const params = await props.params
//   const order = await retrieveOrder(params.id).catch(() => null)
//
//   if (!order) {
//     notFound()
//   }
//
//   return <OrderDetailsTemplate order={order} />
// }

export default function AccountDisabledPage() {
  notFound()
}
