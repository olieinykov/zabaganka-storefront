"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  IN_STOCK_ONLY_QUERY_KEY,
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  options?: HttpTypes.StoreProductOption[]
  search?: boolean
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  options = [],
  hideOptionsPicker = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams]
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => params.set(name, value))

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) =>
        params.append(OPTION_VALUE_QUERY_KEY, valueId)
      )
    })

  const inStockOnly = searchParams.get(IN_STOCK_ONLY_QUERY_KEY) === "true"

  const toggleInStockOnly = () =>
    updateQueryParams((params) => {
      if (inStockOnly) {
        params.delete(IN_STOCK_ONLY_QUERY_KEY)
      } else {
        params.set(IN_STOCK_ONLY_QUERY_KEY, "true")
      }
    })

  return (
    <div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:flex-[0_0_20%] small:ml-[1.675rem]">
      <SortProducts
        sortBy={sortBy}
        setQueryParams={setQueryParams}
        data-testid={dataTestId}
      />
      <div className="flex flex-col gap-y-3">
        <span className="txt-compact-small-plus text-ui-fg-subtle px-1">
          Наявність
        </span>
        <label className="flex items-center gap-x-2 px-1 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={toggleInStockOnly}
            data-testid="in-stock-only-checkbox"
            className="h-4 w-4 rounded border-ui-border-base text-navy accent-navy cursor-pointer focus:ring-navy focus:ring-offset-0"
          />
          <span className="txt-compact-small text-ui-fg-base">
            Тільки товари в наявності
          </span>
        </label>
      </div>
      {!hideOptionsPicker && (
        <OptionsPicker
          options={options}
          selectedValueIds={selectedOptionValueIds}
          setOptionValueIds={setOptionValueIds}
        />
      )}
    </div>
  )
}

export default RefinementList