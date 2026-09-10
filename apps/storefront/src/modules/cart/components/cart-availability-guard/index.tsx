"use client"

import { pruneUnavailableCartItems } from "@lib/data/cart"
import { useToast } from "@modules/common/components/toast"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"


export default function CartAvailabilityGuard() {
  const { showToast } = useToast()
  const router = useRouter()
  const hasChecked = useRef(false)

  useEffect(() => {
    if (hasChecked.current) {
      return
    }
    hasChecked.current = true

    pruneUnavailableCartItems()
      .then(({ removed }) => {
        if (!removed.length) {
          return
        }

        showToast(
          removed.length === 1
            ? "Один товар більше не доступний і був видалений з кошика"
            : "Деякі товари більше не доступні і були видалені з кошика",
          {
            description: removed.join(", "),
            variant: "info",
          }
        )
        router.refresh()
      })
      .catch(() => {
      })
  }, [router, showToast])

  return null
}