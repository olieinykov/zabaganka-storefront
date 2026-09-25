"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { isProductInStock } from "@lib/util/product"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getPublicCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { COUNTRY_CODE, PRODUCT_PREVIEW_FIELDS } from "@lib/constants"
import { getProductPrice } from "@lib/util/get-product-price"
import { productMatchesSearch, tokenizeSearchQuery } from "@lib/util/search"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  fresh = false,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
  fresh?: boolean
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...getPublicCacheOptions("products"),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        ...(fresh ? { cache: "no-store" as const } : { next, cache: "force-cache" as const }),
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

const MAX_PRICE_SORT_BATCH = 1000

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
  inStockOnly,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
  inStockOnly?: boolean
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const { q, ...restQueryParams } = queryParams || {}
  const searchTokens = tokenizeSearchQuery(q)

  const baseQueryParams: ProductListQueryParams = {
    ...restQueryParams,
    ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
  }

  const {
    response: { products: lightProducts, count: totalCount },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      ...baseQueryParams,
      fields:
        "id,created_at,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder" +
        (searchTokens.length ? ",title" : ""),
      limit: MAX_PRICE_SORT_BATCH,
      order: "-created_at",
    },
    countryCode,
  })

  const matchedProducts = searchTokens.length
    ? lightProducts.filter((product) =>
        productMatchesSearch(product, searchTokens)
      )
    : lightProducts

  const withStock = matchedProducts.map((product) => ({
    product,
    inStock: isProductInStock(product),
  }))

  const filtered = inStockOnly
    ? withStock.filter((entry) => entry.inStock)
    : withStock

  const ordered =
    sortBy === "price_asc" || sortBy === "price_desc"
      ? sortProducts(
          filtered.map((entry) => entry.product),
          sortBy
        )
      : filtered.map((entry) => entry.product)

  const finalOrder = inStockOnly
    ? ordered
    : [
        ...ordered.filter((p) =>
          withStock.find((e) => e.product.id === p.id)?.inStock
        ),
        ...ordered.filter(
          (p) => !withStock.find((e) => e.product.id === p.id)?.inStock
        ),
      ]

  const sortedIds = finalOrder.map((p) => p.id)

  const pageParam = (page - 1) * limit
  const pageIds = sortedIds.slice(pageParam, pageParam + limit)

  const count = Math.min(totalCount, sortedIds.length)
  const nextPage = count > pageParam + limit ? page + 1 : null

  if (pageIds.length === 0) {
    return { response: { products: [], count }, nextPage: null, queryParams }
  }

  const {
    response: { products: pageProducts },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      ...baseQueryParams,
      id: pageIds,
      fields: PRODUCT_PREVIEW_FIELDS,
      limit: pageIds.length,
    },
    countryCode,
  })

  // The backend doesn't guarantee id-filtered results come back in the
  // order the ids were passed, so re-apply the order we computed above.
  const byId = new Map(pageProducts.map((p) => [p.id, p]))
  const orderedPageProducts = pageIds
    .map((id) => byId.get(id))
    .filter((p): p is HttpTypes.StoreProduct => Boolean(p))

  return {
    response: { products: orderedPageProducts, count },
    nextPage,
    queryParams,
  }
}

const SEARCH_PREVIEW_LIMIT = 4
const SEARCH_MIN_QUERY_LENGTH = 2

export type SearchPreviewProduct = {
  id: string
  handle: string
  title: string
  thumbnail: string | null
  price: {
    calculated_price: string
    original_price: string
    price_type: string
  } | null
}

export const searchProducts = async (
  query: string
): Promise<{ products: SearchPreviewProduct[]; count: number }> => {
  const q = query.trim()

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return { products: [], count: 0 }
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page: 1,
    queryParams: { q, limit: SEARCH_PREVIEW_LIMIT },
    countryCode: COUNTRY_CODE,
  })

  return {
    count,
    products: products.map((product) => {
      const { cheapestPrice } = getProductPrice({ product })

      return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        thumbnail: product.thumbnail || product.images?.[0]?.url || null,
        price: cheapestPrice
          ? {
              calculated_price: cheapestPrice.calculated_price,
              original_price: cheapestPrice.original_price,
              price_type: cheapestPrice.price_type,
            }
          : null,
      }
    }),
  }
}
