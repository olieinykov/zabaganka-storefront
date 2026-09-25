import { notFound } from "next/navigation"

// ACCOUNT FEATURE: the account area is disabled for now, so this page renders
// the 404 page without running any account requests or exposing its metadata.
// To re-enable it, uncomment the original code below and remove the stub
// export at the bottom of this file (see also `account/layout.tsx`).
//
// import { Metadata } from "next"
// import { notFound } from "next/navigation"
//
// import AddressBook from "@modules/account/components/address-book"
//
// import { COUNTRY_CODE } from "@lib/constants"
// import { getRegion } from "@lib/data/regions"
// import { retrieveCustomer } from "@lib/data/customer"
//
// export const metadata: Metadata = {
//   title: "Адреси",
//   description: "Перегляд ваших адрес доставки",
// }
//
// export default async function Addresses() {
//   const customer = await retrieveCustomer()
//   const region = await getRegion(COUNTRY_CODE)
//
//   if (!customer || !region) {
//     notFound()
//   }
//
//   return (
//     <div className="w-full" data-testid="addresses-page-wrapper">
//       <div className="mb-8 flex flex-col gap-y-4">
//         <h1 className="text-2xl-semi">Адреси доставки</h1>
//         <p className="text-base-regular">
//           Переглядайте та оновлюйте свої адреси доставки — можна додати
//           скільки завгодно. Збережені адреси будуть доступні під час
//           оформлення замовлення.
//         </p>
//       </div>
//       <AddressBook customer={customer} region={region} />
//     </div>
//   )
// }

export default function AccountDisabledPage() {
  notFound()
}
