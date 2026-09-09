"use server"

import { sdk } from "@lib/config"

export type SubmitWaitlistInput = {
  product_id: string
  variant_id?: string | null
  contact_method: "email" | "phone"
  email?: string
  phone?: string
}

export type SubmitWaitlistResult =
  | { ok: true }
  | { ok: false; alreadyRegistered: boolean; message: string }


export async function submitWaitlistEntry(
  input: SubmitWaitlistInput
): Promise<SubmitWaitlistResult> {
  try {
    await sdk.client.fetch("/store/product-waitlist", {
      method: "POST",
      body: input,
    })

    return { ok: true }
  } catch (error: any) {
    const status = error?.status || error?.response?.status
    const message =
      error?.message ||
      "Не вдалося оформити заявку. Спробуйте ще раз трохи пізніше."

    return {
      ok: false,
      alreadyRegistered: status === 409,
      message,
    }
  }
}
