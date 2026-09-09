"use client"

import { addToCart } from "@lib/data/cart"
import { COUNTRY_CODE } from "@lib/constants"
import { useToast } from "@modules/common/components/toast"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { isProductFullyOutOfStock, isVariantInStock } from "@lib/util/product"
import { useState } from "react"

type Props = {
  product: HttpTypes.StoreProduct
  className?: string
}

/**
 * Adds the product's variant directly from a listing card when the product
 * only has a single variant (the common case for jewellery pieces without
 * size/color options). Products with several variants can't be safely
 * defaulted to one, so the button instead links through to the product page
 * where the customer picks a variant.
 */
export default function QuickAddButton({ product, className }: Props) {
  const { showToast } = useToast()
  const countryCode = COUNTRY_CODE
  const [isAdding, setIsAdding] = useState(false)

  const singleVariant =
    product.variants?.length === 1 ? product.variants[0] : null

  const baseClasses =
    "interactive w-full h-10 border text-sm font-medium tracking-wide " +
    (className || "")

  const enabledClasses =
    "border-navy text-navy hover:bg-navy hover:text-white disabled:opacity-50 disabled:pointer-events-none"
  const disabledClasses =
    "border-ui-border-base text-ui-fg-muted bg-ui-bg-subtle cursor-not-allowed"

  // Single-variant product: we know for certain whether it's purchasable.
  if (singleVariant) {
    if (!isVariantInStock(singleVariant)) {
      return (
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className={`${baseClasses} ${disabledClasses} inline-flex items-center justify-center`}
        >
          Немає в наявності
        </LocalizedClientLink>
      )
    }

    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsAdding(true)

      try {
        await addToCart({
          variantId: singleVariant.id,
          quantity: 1,
          countryCode,
        })
        showToast("Товар додано до кошика", { description: product.title })
      } catch {
        showToast("Не вдалося додати товар", {
          description: "Спробуйте ще раз трохи пізніше.",
          variant: "error",
        })
      } finally {
        setIsAdding(false)
      }
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isAdding}
        className={`${baseClasses} ${enabledClasses}`}
      >
        {isAdding ? "Додаємо…" : "Додати до кошика"}
      </button>
    )
  }

  if (isProductFullyOutOfStock(product)) {
    return (
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className={`${baseClasses} ${disabledClasses} inline-flex items-center justify-center`}
      >
        Немає в наявності
      </LocalizedClientLink>
    )
  }

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className={`${baseClasses} ${enabledClasses} inline-flex items-center justify-center`}
    >
      Обрати варіант
    </LocalizedClientLink>
  )
}
