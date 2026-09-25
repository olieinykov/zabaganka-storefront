import { Suspense } from "react"

import { listProductOptions } from "@lib/data/product-options"
import { OptionValueIds } from "@lib/util/product-option-filters"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const CatalogLink = () => (
  <LocalizedClientLink
    href="/store"
    className="rounded-rounded bg-navy px-6 py-3 text-sm text-white interactive"
  >
    Перейти до каталогу
  </LocalizedClientLink>
)

const SearchTemplate = async ({
  q,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  inStockOnly,
}: {
  q: string
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  inStockOnly?: boolean
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!q) {
    return (
      <div
        className="flex flex-col items-center text-center gap-4 py-24 content-container"
        data-testid="search-empty-query"
      >
        <h1 className="font-display text-3xl text-navy">Пошук</h1>
        <p className="text-graphite">
          Введіть назву товару у пошуку вгорі сторінки
        </p>
        <CatalogLink />
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
          <h1 data-testid="search-page-title">Результати пошуку «{q}»</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            q={q}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
            inStockOnly={inStockOnly}
            emptyState={
              <div
                className="flex flex-col items-center text-center gap-4 py-16"
                data-testid="search-no-results"
              >
                <p className="text-graphite">
                  За запитом «{q}» нічого не знайдено
                </p>
                <CatalogLink />
              </div>
            }
          />
        </Suspense>
      </div>
    </div>
  )
}

export default SearchTemplate
