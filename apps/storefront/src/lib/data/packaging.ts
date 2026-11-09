"use server"

import { sdk } from "@lib/config"
import {
  DEFAULT_PACKAGING,
  DefaultPackaging,
  PackagingData,
  PackagingOption,
} from "@lib/util/packaging"
import { getPublicCacheOptions } from "./cookies"

type PackagingOptionsResponse = {
  default?: DefaultPackaging
  products: { product_id: string; options: PackagingOption[] }[]
}

export async function listPackagingOptions(
  productIds: string[],
  { fresh = false }: { fresh?: boolean } = {}
): Promise<PackagingData> {
  const ids = Array.from(new Set(productIds.filter(Boolean)))

  return sdk.client
    .fetch<PackagingOptionsResponse>("/store/packaging-options", {
      method: "GET",
      query: ids.length ? { product_id: ids } : {},
      ...(fresh
        ? { cache: "no-store" as const }
        : {
            next: getPublicCacheOptions("packaging"),
            cache: "force-cache" as const,
          }),
    })
    .then(({ default: defaultPackaging, products }) => ({
      defaultPackaging: defaultPackaging ?? DEFAULT_PACKAGING,
      byProduct: Object.fromEntries(
        products.map((product) => [product.product_id, product.options])
      ),
    }))
    .catch(() => ({ defaultPackaging: DEFAULT_PACKAGING, byProduct: {} }))
}
