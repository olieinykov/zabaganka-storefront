import { Metadata } from "next"
import { redirect } from "next/navigation"
import MonoReturnClient from "@modules/checkout/components/mono-return-client"

export const metadata: Metadata = {
  title: "Підтвердження оплати",
}

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function MonoReturnPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  if (!session_id) {
    redirect("/checkout?step=payment")
  }

  return (
    <div className="content-container flex flex-col items-center justify-center py-24 gap-y-6 text-center">
      <MonoReturnClient sessionId={session_id} />
    </div>
  )
}
