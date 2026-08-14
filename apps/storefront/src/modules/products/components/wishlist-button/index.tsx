"use client"

import Heart from "@modules/common/icons/heart"
import { useState } from "react"

/**
 * Purely visual wishlist toggle — there is no wishlist entity on the backend
 * (Medusa's default customer module doesn't include one), so this only
 * reflects local UI state. Wire this up to a real wishlist module/API route
 * if/when that feature is added on the backend.
 */
export default function WishlistButton({
  className,
}: {
  className?: string
}) {
  const [saved, setSaved] = useState(false)

  return (
    <button
      type="button"
      aria-label={saved ? "Прибрати з обраного" : "Додати до обраного"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSaved((v) => !v)
      }}
      className={
        "interactive interactive-lift inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 shadow-sm hover:shadow-md " +
        (className || "")
      }
    >
      <Heart size={16} filled={saved} color={saved ? "#a4834f" : "#181817"} />
    </button>
  )
}
