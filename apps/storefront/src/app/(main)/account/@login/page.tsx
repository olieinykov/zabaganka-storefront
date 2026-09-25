import { notFound } from "next/navigation"

// ACCOUNT FEATURE: the account area is disabled for now, so this page renders
// the 404 page without running any account requests or exposing its metadata.
// To re-enable it, uncomment the original code below and remove the stub
// export at the bottom of this file (see also `account/layout.tsx`).
//
// import { Metadata } from "next"
//
// import LoginTemplate from "@modules/account/templates/login-template"
//
// export const metadata: Metadata = {
//   title: "Sign in",
//   description: "Sign in to your Medusa Store account.",
// }
//
// export default function Login() {
//   return <LoginTemplate />
// }

export default function AccountDisabledPage() {
  notFound()
}
