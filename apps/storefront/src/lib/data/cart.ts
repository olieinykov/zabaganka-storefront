"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
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

export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
  "*items, *region, *items.product, *items.variant, +items.variant.manage_inventory, +items.variant.allow_backorder, *items.variant.inventory_items.inventory.location_levels, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"
  
  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Bug this fixes: when an admin deletes a product/variant, the backend
  // cleans up carts that reference it right away (see the
  // `cart-cleanup-on-product-removed` subscriber) — but that happens in a
  // different process than the storefront, which has no way to tell this
  // Next.js server to drop its cached copy of the cart (the cache tag for
  // carts is scoped per browser session via the `_medusa_cache_id` cookie,
  // so the backend can't reconstruct it from just a cart id). With
  // `cache: "force-cache"` here, the storefront kept serving the old
  // cached snapshot — still showing the deleted item — until something on
  // the storefront side happened to bust that tag itself, which is why
  // only a hard refresh (bypassing the cache entirely) showed the correct
  // cart. Cart contents are inherently per-user, fast-changing data, so we
  // just always fetch them fresh instead of caching them.
  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      cache: "no-store",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id,completed_at")

  if (cart && (cart as unknown as { completed_at?: string | null }).completed_at) {
    await removeCartId()
    cart = null
  }

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
}: {
  variantId: string
  quantity: number
  countryCode: string
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

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
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

export async function setCartDeliveryMetadata(
  cartId: string,
  delivery: Record<string, unknown>
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { metadata: { delivery } }, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      updateTag(cartCacheTag)
      return cart
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

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(`/checkout?step=delivery`)
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