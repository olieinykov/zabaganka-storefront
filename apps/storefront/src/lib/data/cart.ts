"use server"

import { sdk } from "@lib/config"
import medusaError, { toFriendlyMessage } from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { updateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "./locale-actions"
import { COUNTRY_CODE } from "@lib/constants"

export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, +items.variant.manage_inventory, +items.variant.allow_backorder, *items.variant.inventory_items.inventory.location_levels, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, +shipping_methods.data"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      cache: "no-store",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) =>
      (cart as unknown as { completed_at?: string | null }).completed_at
        ? null
        : cart
    )
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id,completed_at")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    updateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    updateTag(cartCacheTag)
  }

  return cart
}

export async function pruneUnavailableCartItems(): Promise<{
  removed: string[]
}> {
  const cartId = await getCartId()
  if (!cartId) {
    return { removed: [] }
  }

  const cart = await retrieveCart(cartId)
  if (!cart?.items?.length) {
    return { removed: [] }
  }

  const staleItems = cart.items.filter((item) => !item.product || !item.variant)

  if (!staleItems.length) {
    return { removed: [] }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await Promise.all(
    staleItems.map((item) =>
      sdk.store.cart
        .deleteLineItem(cart.id, item.id, {}, headers)
        .catch(() => null)
    )
  )

  const cartCacheTag = await getCacheTag("carts")
  updateTag(cartCacheTag)

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  updateTag(fulfillmentCacheTag)

  return {
    removed: staleItems.map(
      (item) => item.product_title || item.title || "Товар"
    ),
  }
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      updateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  packagingVariantId,
}: {
  variantId: string
  quantity: number
  countryCode: string
  packagingVariantId?: string | null
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const request = packagingVariantId
    ? sdk.client.fetch(`/store/carts/${cart.id}/packaging-items`, {
        method: "POST",
        body: {
          variant_id: variantId,
          quantity,
          packaging_variant_id: packagingVariantId,
        },
        headers,
      })
    : sdk.store.cart.createLineItem(
        cart.id,
        {
          variant_id: variantId,
          quantity,
        },
        {},
        headers
      )

  await request
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      updateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      updateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function changeLineItemPackaging({
  lineId,
  packagingVariantId,
}: {
  lineId: string
  packagingVariantId: string | null
}): Promise<{ error: string | null }> {
  const cartId = await getCartId()

  if (!cartId || !lineId) {
    return { error: "Кошик не знайдено. Оновіть сторінку." }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.client.fetch(`/store/carts/${cartId}/packaging-items/${lineId}`, {
      method: "POST",
      body: { packaging_variant_id: packagingVariantId },
      headers,
    })
  } catch (err) {
    return { error: toFriendlyMessage(err) }
  }

  const cartCacheTag = await getCacheTag("carts")
  updateTag(cartCacheTag)

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  updateTag(fulfillmentCacheTag)

  return { error: null }
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      updateTag(fulfillmentCacheTag)
    })
    .catch(async (err) => {
      const message = err?.message ?? String(err)
      if (/already completed/i.test(message)) {
        await removeCartId()
        throw new Error(
          "Це замовлення вже оформлено. Оновіть сторінку, щоб почати новий кошик."
        )
      }
      medusaError(err)
    })
}

async function syncDeliveryAddress(
  cartId: string,
  data: Record<string, unknown>,
  headers: Record<string, string>
) {
  const cart = await retrieveCart(cartId, "*shipping_address")
  const current = cart?.shipping_address
  if (!current) {
    return
  }

  const addressLine =
    data.type === "courier" && typeof data.address === "string"
      ? data.address.trim()
      : ""
  const city = typeof data.city_name === "string" ? data.city_name : ""

  if ((current.address_1 || "") === addressLine && (current.city || "") === city) {
    return
  }

  // Medusa replaces the whole address on update, so resend every field.
  const address = {
    first_name: current.first_name || "",
    last_name: current.last_name || "",
    phone: current.phone || "",
    country_code: current.country_code || COUNTRY_CODE,
    address_1: addressLine,
    city,
  }

  await sdk.store.cart
    .update(cartId, { shipping_address: address }, {}, headers)
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
  data,
}: {
  cartId: string
  shippingMethodId: string
  data?: Record<string, unknown>
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (data?.carrier) {
    await syncDeliveryAddress(cartId, data, headers)
  }

  return sdk.store.cart
    .addShippingMethod(
      cartId,
      { option_id: shippingMethodId, ...(data ? { data } : {}) },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

// PROMO CODE FEATURE
// Applying promo codes to the cart is disabled on the storefront. Kept
// commented out in case this needs to be re-enabled later.
// export async function applyPromotions(codes: string[]) {
//   const cartId = await getCartId()
//
//   if (!cartId) {
//     throw new Error("No existing cart found")
//   }
//
//   const headers = {
//     ...(await getAuthHeaders()),
//   }
//
//   return sdk.store.cart
//     .update(cartId, { promo_codes: codes }, {}, headers)
//     .then(async () => {
//       const cartCacheTag = await getCacheTag("carts")
//       updateTag(cartCacheTag)
//
//       const fulfillmentCacheTag = await getCacheTag("fulfillment")
//       updateTag(fulfillmentCacheTag)
//     })
//     .catch(medusaError)
// }

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

// PROMO CODE FEATURE
// export async function submitPromotionForm(
//   currentState: unknown,
//   formData: FormData
// ) {
//   const code = formData.get("code") as string
//   try {
//     await applyPromotions([code])
//   } catch (e: any) {
//     return e.message
//   }
// }

function formValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

/**
 * Checkout "recipient" step: only the name, email and an optional phone are
 * collected here. The delivery destination is picked on the next step (and
 * for courier delivery written into `address_1`/`city` by
 * setShippingMethod), so the street/city already on the cart are carried
 * over instead of being wiped: Medusa replaces the whole address object on
 * update rather than merging it.
 */
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const firstName = formValue(formData, "shipping_address.first_name")
    const lastName = formValue(formData, "shipping_address.last_name")
    const email = formValue(formData, "email")

    if (!firstName || !lastName || !email) {
      return "Заповніть ім'я, прізвище та електронну пошту."
    }

    const current = await retrieveCart(cartId, "*shipping_address")
    const currentAddress = current?.shipping_address

    const address = {
      first_name: firstName,
      last_name: lastName,
      phone: formValue(formData, "shipping_address.phone"),
      country_code:
        formValue(formData, "shipping_address.country_code") ||
        currentAddress?.country_code ||
        COUNTRY_CODE,
      address_1: currentAddress?.address_1 || "",
      city: currentAddress?.city || "",
    }

    // Billing address is not asked for anymore; Medusa and the payment
    // step still expect one, so it mirrors the recipient.
    const data = {
      shipping_address: address,
      billing_address: address,
      email,
    }

    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  const returnTo = formData.get("return_to")
  const allowedSteps = ["delivery", "payment", "review"]
  const targetStep =
    typeof returnTo === "string" && allowedSteps.includes(returnTo)
      ? returnTo
      : "delivery"
  redirect(`/checkout?step=${targetStep}`)
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const orderCacheTag = await getCacheTag("orders")
    updateTag(orderCacheTag)

    removeCartId()
    redirect(`/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Drops the cart cookie when the cart was already turned into an order by
 * the backend (mono webhook / mono-complete-paid-orders job) rather than by
 * placeOrder() above, which clears it itself.
 */
export async function clearCompletedCart() {
  const id = await getCartId()
  if (!id) {
    return
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cart = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: { fields: "id,completed_at" },
      headers,
      cache: "no-store",
    })
    .then(({ cart }) => cart as unknown as { completed_at?: string | null })
    .catch(() => null)

  if (!cart?.completed_at) {
    return
  }

  await removeCartId()
  const cartCacheTag = await getCacheTag("carts")
  updateTag(cartCacheTag)
  const orderCacheTag = await getCacheTag("orders")
  updateTag(orderCacheTag)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}