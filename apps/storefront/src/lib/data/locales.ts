"use server"

import { sdk } from "@lib/config"
import { getPublicCacheOptions } from "./cookies"

export type Locale = {
  code: string
  name: string
}


export const listLocales = async (): Promise<Locale[] | null> => {
  const next = {
    ...getPublicCacheOptions("locales"),
    revalidate: 300,
  }

  return sdk.client
    .fetch<{ locales: Locale[] }>(`/store/locales`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ locales }) => locales)
    .catch(() => null)
}
