"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getPublicCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"
import { PRODUCT_PREVIEW_FIELDS } from "@lib/constants"

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
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
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
        next,
        cache: "force-cache",
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

/**
 * Returns paginated, sorted products for the store grid.
 *
 * - `sortBy: "created_at"` (the default, and the common case) is fully
 *   delegated to the backend: we ask `/store/products` for exactly the page
 *   we need (`limit`/`offset`) already ordered by `created_at`, instead of
 *   fetching 100 products and slicing in JS. This also fixes pagination
 *   correctness as a side effect — `count` is now the real backend total,
 *   not capped at whatever the last "fetch 100" happened to return.
 *
 * - `price_asc` / `price_desc` can't be delegated: `calculated_price` is a
 *   computed field and Medusa's `/store/products` list can't order by it.
 *   Computing the sort order still requires the price of every matching
 *   product — that part is unavoidable without backend support. What IS
 *   avoidable is fetching the heavy card fields (thumbnail/images/
 *   categories) for all of them just to throw away everything except the
 *   12 the current page needs. So this path is two lightweight requests
 *   instead of one heavy one:
 *     1. `id,*variants.calculated_price` for up to `MAX_PRICE_SORT_BATCH`
 *        matching products — enough to sort and pick the right page's ids.
 *     2. `PRODUCT_PREVIEW_FIELDS` filtered to just those ~12 ids — the only
 *        request that pays for thumbnail/images/categories.
 *   `MAX_PRICE_SORT_BATCH` is a real (documented) cap, not the old "100 and
 *   hope": if a filter genuinely matches more than that, price-sort
 *   pagination past the cap won't be reachable, same class of limitation as
 *   before, just far more generous and now isolated to a single named
 *   constant instead of buried in the fetch call.
 */
const MAX_PRICE_SORT_BATCH = 1000

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const baseQueryParams: ProductListQueryParams = {
    ...queryParams,
    ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
  }

  if (sortBy !== "price_asc" && sortBy !== "price_desc") {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: Math.max(page, 1),
      queryParams: {
        ...baseQueryParams,
        fields: PRODUCT_PREVIEW_FIELDS,
        limit,
        order: "-created_at",
      },
      countryCode,
    })

    const nextPage = count > page * limit ? page + 1 : null

    return {
      response: { products, count },
      nextPage,
      queryParams,
    }
  }

  // Step 1: light request — just enough to determine sort order and which
  // ids belong on the requested page. No thumbnail/images/categories here.
  const {
    response: { products: priceOnlyProducts, count: totalCount },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      ...baseQueryParams,
      fields: "id,*variants.calculated_price",
      limit: MAX_PRICE_SORT_BATCH,
    },
    countryCode,
  })

  const sortedIds = sortProducts(priceOnlyProducts, sortBy).map((p) => p.id)

  const pageParam = (page - 1) * limit
  const pageIds = sortedIds.slice(pageParam, pageParam + limit)

  // Real total when it fits in the batch; otherwise we only know it's at
  // least as many as we fetched (same documented cap as above).
  const count = Math.min(totalCount, sortedIds.length)
  const nextPage = count > pageParam + limit ? page + 1 : null

  if (pageIds.length === 0) {
    return { response: { products: [], count }, nextPage: null, queryParams }
  }

  // Step 2: fetch full card data for ONLY this page's ids.
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
  // order the ids were passed, so re-apply the price order we computed in
  // step 1.
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
