"use client"

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useCallback, useMemo, useState } from "react"

import {
  IN_STOCK_ONLY_QUERY_KEY,
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import Filter from "@modules/common/icons/filter"
import X from "@modules/common/icons/x"
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
  const [mobileOpen, setMobileOpen] = useState(false)

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
        router.push(nextPath, { scroll: false })
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

  const activeFilterCount =
    selectedOptionValueIds.length + (inStockOnly ? 1 : 0)

  const controls = (
    <>
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
    </>
  )

  return (
    <>
      <div className="hidden small:flex flex-col gap-12 py-4 mb-8 small:flex-[0_0_20%] small:ml-[1.675rem]">
        {controls}
      </div>

      <div className="small:hidden flex justify-end">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 border border-line rounded-rounded px-4 py-2.5 text-sm text-ink interactive"
          data-testid="mobile-filters-button"
        >
          <Filter size={15} />
          Фільтри
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-circle bg-gold px-1 text-[11px] text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <Transition show={mobileOpen} as={Fragment as React.ElementType}>
        <Dialog
          as="div"
          className="relative z-[90] small:hidden"
          onClose={() => setMobileOpen(false)}
        >
          <TransitionChild
            as={Fragment as React.ElementType}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/40" />
          </TransitionChild>

          <div className="fixed inset-x-0 bottom-0">
            <TransitionChild
              as={Fragment as React.ElementType}
              enter="ease-out duration-200"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <DialogPanel className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-ivory">
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                  <span className="font-display text-xl text-ink">
                    Фільтри
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Закрити фільтри"
                    className="interactive text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-12 overflow-y-auto px-6 py-6">
                  {controls}
                </div>
                <div className="border-t border-line px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="w-full rounded-rounded bg-navy py-3 text-sm text-white interactive"
                    data-testid="apply-mobile-filters-button"
                  >
                    Показати результати
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default RefinementList