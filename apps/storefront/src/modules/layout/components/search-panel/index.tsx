"use client"

import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { searchProducts, SearchPreviewProduct } from "@lib/data/products"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Search from "@modules/common/icons/search"
import X from "@modules/common/icons/x"

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_MIN_QUERY_LENGTH = 2

type SearchResults = {
  products: SearchPreviewProduct[]
  count: number
}

export default function SearchPanel() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)

  const trimmedQuery = query.trim()
  const canSearch = trimmedQuery.length >= SEARCH_MIN_QUERY_LENGTH

  useEffect(() => {
    if (!canSearch) {
      requestIdRef.current++
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const requestId = ++requestIdRef.current

    const timeout = setTimeout(async () => {
      try {
        const response = await searchProducts(trimmedQuery)

        if (requestId === requestIdRef.current) {
          setResults(response)
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setResults({ products: [], count: 0 })
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [trimmedQuery, canSearch])

  const closeAndReset = (close: () => void) => {
    close()
    setQuery("")
  }

  const goToResults = (close: () => void) => {
    if (!trimmedQuery) {
      return
    }

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
    closeAndReset(close)
  }

  return (
    <Popover className="relative flex">
      {({ close }) => (
        <>
          <PopoverButton
            aria-label="Пошук"
            className="inline-flex interactive interactive-lift text-ink hover:text-navy focus:outline-none"
            data-testid="nav-search-button"
          >
            <Search size={19} />
          </PopoverButton>

          <PopoverBackdrop
            transition
            className="fixed inset-0 z-[80] bg-ink/50 transition duration-150 ease-out data-[closed]:opacity-0"
            data-testid="search-backdrop"
          />

          <PopoverPanel
            focus
            transition
            anchor={{ to: "bottom end", gap: 20, padding: 16 }}
            className="z-[90] w-[420px] max-w-[calc(100vw-2rem)] rounded-rounded border border-line bg-ivory shadow-lg transition duration-150 ease-out data-[closed]:-translate-y-1 data-[closed]:opacity-0"
            data-testid="search-panel"
          >
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault()
                goToResults(close)
              }}
              className="flex items-center gap-3 border-b border-line px-4 py-3"
            >
              <Search size={16} className="shrink-0 text-graphite" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук товарів..."
                aria-label="Пошук товарів"
                className="w-full bg-transparent text-sm text-ink placeholder:text-graphite outline-none [&::-webkit-search-cancel-button]:hidden"
                data-testid="search-input"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Очистити пошук"
                  className="interactive text-graphite hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {canSearch && (
              <div className="px-4 pb-3">
                {loading && !results ? (
                  <SearchSkeleton />
                ) : results && results.products.length === 0 ? (
                  <p className="py-4 text-sm text-graphite">
                    Нічого не знайдено
                  </p>
                ) : results ? (
                  <div
                    className={clx("flex flex-col interactive", {
                      "opacity-60": loading,
                    })}
                  >
                    <ul>
                      {results.products.map((product) => (
                        <li key={product.id}>
                          <SearchResultRow
                            product={product}
                            onSelect={() => closeAndReset(close)}
                          />
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => goToResults(close)}
                      className="mt-3 self-start text-sm text-navy underline underline-offset-4 hover:text-gold interactive"
                      data-testid="search-show-all"
                    >
                      Показати всі результати ({results.count})
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}

function SearchResultRow({
  product,
  onSelect,
}: {
  product: SearchPreviewProduct
  onSelect: () => void
}) {
  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      onClick={onSelect}
      className="group flex items-center gap-4 py-3 border-b border-line"
      data-testid="search-result"
    >
      <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-milk">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlaceholderImage size={16} />
          </div>
        )}
      </div>
      <span className="flex-1 font-display text-base leading-snug text-navy group-hover:text-gold interactive">
        {product.title}
      </span>
      {product.price && (
        <div className="flex shrink-0 flex-col items-end">
          {product.price.price_type === "sale" && (
            <span className="text-xs line-through text-graphite">
              {product.price.original_price}
            </span>
          )}
          <span
            className={clx("text-sm font-semibold text-navy", {
              "text-gold": product.price.price_type === "sale",
            })}
          >
            {product.price.calculated_price}
          </span>
        </div>
      )}
    </LocalizedClientLink>
  )
}

function SearchSkeleton() {
  return (
    <ul>
      {[0, 1, 2, 3].map((i) => (
        <li
          key={i}
          className="flex items-center gap-4 py-3 border-b border-line animate-pulse"
        >
          <div className="h-16 w-12 shrink-0 bg-milk" />
          <div className="h-4 flex-1 bg-milk" />
          <div className="h-4 w-16 bg-milk" />
        </li>
      ))}
    </ul>
  )
}
