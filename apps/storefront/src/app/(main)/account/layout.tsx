import { notFound } from "next/navigation"
// ACCOUNT FEATURE: the account area is disabled for now — every /account/*
// route renders the 404 page. To re-enable it, restore the imports and the
// original layout body below and drop the `notFound()` call.
// import { retrieveCustomer } from "@lib/data/customer"
// import AccountLayout from "@modules/account/templates/account-layout"

export default async function AccountPageLayout(_props: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  notFound()

  // ACCOUNT FEATURE: original layout body.
  // const { dashboard, login } = _props
  // const customer = await retrieveCustomer().catch(() => null)
  //
  // return (
  //   <AccountLayout customer={customer}>
  //     {customer ? dashboard : login}
  //   </AccountLayout>
  // )
}
