import { Metadata } from "next"

import { COUNTRY_CODE } from "@lib/constants"
import { parseInStockOnly, parseOptionValueIds } from "@lib/util/product-option-filters"
import SearchTemplate from "@modules/search/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type SearchPageSearchParams = Record<string, string | string[] | undefined> & {
  q?: string | string[]
  sortBy?: SortOptions
  page?: string
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<SearchPageSearchParams>
}

const parseQuery = (value?: string | string[]) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? ""

export async function generateMetadata(props: Params): Promise<Metadata> {
  const q = parseQuery((await props.searchParams).q)

  return {
    title: q ? `Пошук: «${q}»` : "Пошук",
    robots: { index: false },
  }
}

export default async function SearchPage(props: Params) {
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const q = parseQuery(searchParams.q)
  const optionValueIds = parseOptionValueIds(searchParams)
  const inStockOnly = parseInStockOnly(searchParams)

  return (
    <SearchTemplate
      q={q}
      sortBy={sortBy}
      page={page}
      countryCode={COUNTRY_CODE}
      optionValueIds={optionValueIds}
      inStockOnly={inStockOnly}
    />
  )
}
