"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

export type ToastVariant = "success" | "error" | "info"

type Toast = {
  id: number
  message: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (
    message: string,
    options?: { description?: string; variant?: ToastVariant }
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 3200

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (
      message: string,
      options?: { description?: string; variant?: ToastVariant }
    ) => {
      const id = ++idRef.current
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          description: options?.description,
          variant: options?.variant || "success",
        },
      ])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[360px]"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="rounded-md border shadow-lg px-4 py-3 flex items-start gap-3"
            style={{
              backgroundColor: "var(--white)",
              borderColor:
                t.variant === "error" ? "var(--error)" : "var(--line)",
              animation: "toast-in var(--duration) var(--ease) forwards",
            }}
          >
            <span
              className="mt-1 h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor:
                  t.variant === "error" ? "var(--error)" : "var(--gold)",
              }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="font-ui text-sm font-medium"
                style={{ color: "var(--ink)" }}
              >
                {t.message}
              </p>
              {t.description && (
                <p
                  className="font-ui text-xs mt-0.5"
                  style={{ color: "var(--graphite)" }}
                >
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Закрити сповіщення"
              className="text-graphite hover:text-ink interactive shrink-0"
              style={{ color: "var(--graphite)" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return ctx
}
