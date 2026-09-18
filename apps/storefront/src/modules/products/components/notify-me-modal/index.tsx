"use client"

import { submitWaitlistEntry } from "@lib/data/product-waitlist"
import { useToast } from "@modules/common/components/toast"
import { Button } from "@modules/common/components/ui"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type ContactMethod = "email" | "phone"

type Props = {
  productId: string
  variantId?: string | null
  isOpen: boolean
  onClose: () => void
}

const PHONE_PREFIX = "+380"

export default function NotifyMeModal({
  productId,
  variantId,
  isOpen,
  onClose,
}: Props) {
  const { showToast } = useToast()
  const [method, setMethod] = useState<ContactMethod>("email")
  const [email, setEmail] = useState("")
  const [phoneDigits, setPhoneDigits] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setMethod("email")
      setEmail("")
      setPhoneDigits("")
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === "undefined") {
    return null
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const isPhoneValid = /^\d{9}$/.test(phoneDigits)
  const canSubmit = method === "email" ? isEmailValid : isPhoneValid

  const handlePhoneChange = (value: string) => {
    setPhoneDigits(value.replace(/\D/g, "").slice(0, 9))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const result = await submitWaitlistEntry({
      product_id: productId,
      variant_id: variantId || null,
      contact_method: method,
      ...(method === "email"
        ? { email: email.trim() }
        : { phone: `${PHONE_PREFIX}${phoneDigits}` }),
    })

    setIsSubmitting(false)

    if (result.ok) {
      onClose()
      showToast("Заявку прийнято", {
        description: "Очікуйте, ми зв'яжемося з вами, коли товар з'явиться.",
      })
      return
    }

    if (result.alreadyRegistered) {
      onClose()
      showToast("Ви вже в списку очікування", {
        description: result.message,
        variant: "info",
      })
      return
    }

    setError(result.message)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-me-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white w-full max-w-md rounded-md shadow-lg p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="absolute top-4 right-4 text-ui-fg-subtle hover:text-ui-fg-base text-lg leading-none"
        >
          ✕
        </button>

        <h2
          id="notify-me-modal-title"
          className="font-ui text-lg font-semibold text-ui-fg-base mb-1"
        >
          Повідомити, коли з'явиться
        </h2>
        <p className="text-sm text-ui-fg-subtle mb-5">
          Залиште контакт, і ми зв'яжемося з вами, як тільки товар знову буде
          в наявності.
        </p>

        <form onSubmit={handleSubmit}>
          {/* PHONE FEATURE */}
          {/*<div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMethod("email")}
              className={`flex-1 h-10 border text-sm rounded-md transition-colors ${
                method === "email"
                  ? "border-navy text-navy font-medium"
                  : "border-ui-border-base text-ui-fg-subtle"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMethod("phone")}
              className={`flex-1 h-10 border text-sm rounded-md transition-colors ${
                method === "phone"
                  ? "border-navy text-navy font-medium"
                  : "border-ui-border-base text-ui-fg-subtle"
              }`}
            >
              Телефон
            </button>
          </div>*/}

          {method === "email" ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 border border-ui-border-base rounded-md px-3 text-base mb-2"
            />
          ) : (
            <div className="flex items-center border border-ui-border-base rounded-md mb-2 overflow-hidden">
              <span className="px-3 text-base text-ui-fg-subtle bg-ui-bg-subtle h-10 flex items-center">
                {PHONE_PREFIX}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDigits}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="991234567"
                className="flex-1 h-10 px-3 text-base outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-ui-fg-error mb-2">{error}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 mt-3"
            disabled={!canSubmit || isSubmitting}
            isLoading={isSubmitting}
          >
            Надіслати заявку
          </Button>
        </form>
      </div>
    </div>,
    document.body
  )
}