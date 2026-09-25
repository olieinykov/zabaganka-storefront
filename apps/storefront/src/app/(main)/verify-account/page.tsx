import { notFound } from "next/navigation"
// ACCOUNT FEATURE: email verification is part of the account signup flow,
// which is disabled for now — this route renders the 404 page. To re-enable
// it, restore the imports, metadata and original page body below and drop the
// `notFound()` call.
// import { Metadata } from "next"
// import { Suspense } from "react"
//
// import VerifyAccount from "@modules/account/components/verify-account"
//
// export const metadata: Metadata = {
//   title: "Verify your email",
//   description: "Verify your email address to complete your registration.",
// }

export default function VerifyAccountPage() {
  notFound()

  // ACCOUNT FEATURE: original page body.
  // return (
  //   <div className="w-full flex justify-center px-8 py-12">
  //     <Suspense
  //       fallback={
  //         <p className="text-base-regular text-ui-fg-base">
  //           Verifying your email...
  //         </p>
  //       }
  //     >
  //       <VerifyAccount />
  //     </Suspense>
  //   </div>
  // )
}
