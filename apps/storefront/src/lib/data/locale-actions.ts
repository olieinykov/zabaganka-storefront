"use server"

import { sdk } from "@lib/config"
import { updateTag } from "next/cache"
import { cookies as nextCookies } from "next/headers"
import { getAuthHeaders, getCacheTag, getCartId } from "./cookies"

const LOCALE_COOKIE_NAME = "_medusa_locale"

/**
 * Gets the current locale from cookies
 */
export const getLocale = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    return cookies.get(LOCALE_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

/**
 * Sets the locale cookie
 */
export const setLocaleCookie = async (locale: string) => {
  const cookies = await nextCookies()
  cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

/**
 * Updates the locale preference via SDK and stores in cookie.
 * Also updates the cart with the new locale if one exists.
 */
export const updateLocale = async (localeCode: string): Promise<string> => {
  await setLocaleCookie(localeCode)

  // Update cart with the new locale if a cart exists
  const cartId = await getCartId()
  if (cartId) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    await sdk.store.cart.update(cartId, { locale: localeCode }, {}, headers)

    // Cart is per-visitor data — this user just changed it, so they should
    // see the change immediately: updateTag (read-your-writes), not
    // revalidateTag.
    const cartCacheTag = await getCacheTag("carts")
    if (cartCacheTag) {
      updateTag(cartCacheTag)
    }
  }

  // Products/categories/collections now use a single shared, public cache
  // tag (see `getPublicCacheOptions` in `cookies.ts`) rather than one scoped
  // per visitor, so we invalidate those tags directly by name.
  updateTag("products")
  updateTag("categories")
  updateTag("collections")

  return localeCode
}
