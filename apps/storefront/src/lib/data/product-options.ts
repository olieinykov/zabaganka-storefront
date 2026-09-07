"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getPublicCacheOptions } from "./cookies"


export async function listProductOptions(): Promise<
  HttpTypes.StoreProductOption[]
> {
  try {
    const next = {
      ...getPublicCacheOptions("product-options"),
      revalidate: 300,
    }

    const response = await sdk.client.fetch<{
      product_options?: HttpTypes.StoreProductOption[]
    }>("/store/product-options", {
      method: "GET",
      query: {
        is_exclusive: false,
        fields: "*values",
      },
      next,
      cache: "force-cache",
    })

    return response?.product_options ?? []
  } catch (error) {
    console.error("Failed to fetch product options", error)
    return []
  }
}