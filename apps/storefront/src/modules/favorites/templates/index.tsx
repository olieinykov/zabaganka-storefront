import { Suspense } from "react"

import { listProductOptions } from "@lib/data/product-options"
import { OptionValueIds } from "@lib/util/product-option-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const FavoritesTemplate = async ({
  favoriteIds,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  inStockOnly,
}: {
  favoriteIds: string[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  inStockOnly?: boolean
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!favoriteIds.length) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-24 content-container"
        data-testid="favorites-empty"
      >
        <h1 className="font-display text-3xl text-navy">Обране</h1>
        <p className="text-graphite">У вас поки немає обраних товарів</p>
        <LocalizedClientLink
          href="/store"
          className="rounded-rounded bg-navy px-6 py-3 text-sm text-white interactive"
        >
          Перейти до каталогу
        </LocalizedClientLink>
      </div>
    )
  }

  const options = await listProductOptions()

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} options={options} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="favorites-page-title">Обране</h1>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={Math.min(favoriteIds.length, 12)}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            productsIds={favoriteIds}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
            inStockOnly={inStockOnly}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default FavoritesTemplate
