"use client"

import Heart from "@modules/common/icons/heart"
import { useFavorites } from "@modules/favorites/context"

export default function WishlistButton({
  productId,
  productTitle,
  variant = "card",
  className,
}: {
  productId: string
  productTitle?: string
  /** "card" — round chip over a product image, "pdp" — square button next to "add to cart" */
  variant?: "card" | "pdp"
  className?: string
}) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const saved = isFavorite(productId)

  const variantClassName =
    variant === "pdp"
      ? "h-10 w-10 shrink-0 rounded-rounded border border-line bg-white hover:border-navy"
      : "h-8 w-8 rounded-full bg-white/90 shadow-sm hover:shadow-md"

  return (
    <button
      type="button"
      aria-label={saved ? "Прибрати з обраного" : "Додати до обраного"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(productId, productTitle)
      }}
      className={
        "interactive interactive-lift inline-flex items-center justify-center " +
        variantClassName +
        " " +
        (className || "")
      }
      data-testid="wishlist-button"
    >
      <Heart
        size={variant === "pdp" ? 18 : 16}
        filled={saved}
        color={saved ? "#a4834f" : "#181817"}
      />
    </button>
  )
}
