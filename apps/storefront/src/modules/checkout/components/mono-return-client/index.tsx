"use client"

import { placeOrder } from "@lib/data/cart"
import { fetchMonoStatus, type MonoStatusResponse } from "@lib/data/mono"
import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

const POLL_INTERVAL_MS = 2500
const MAX_POLLS = 40 

type ViewState = "checking" | "completing" | "failed" | "timeout" | "error"

function isNextRedirectError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "digest" in err &&
    String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  )
}

export default function MonoReturnClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>("checking")
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const pollCount = useRef(0)
  const cancelled = useRef(false)

  const completeWithOrder = useCallback((id: string) => {
    router.replace(`/order/${id}/confirmed`)
  }, [router])

  const tryPlaceOrder = useCallback(
    async (data: MonoStatusResponse) => {
      try {
        await placeOrder()
        setView("error")
      } catch (err) {
        if (isNextRedirectError(err)) {
          throw err
        }

        const message = err instanceof Error ? err.message : String(err)
        if (/no existing cart/i.test(message)) {
          for (let i = 0; i < 5; i++) {
            await new Promise((r) => setTimeout(r, 1500))
            try {
              const fresh = await fetchMonoStatus(sessionId)
              if (fresh.order_id) {
                completeWithOrder(fresh.order_id)
                return
              }
            } catch {
            }
          }
        }

        setView("error")
      }
    },
    [sessionId, completeWithOrder]
  )

  const runPoll = useCallback(async () => {
    if (cancelled.current) return

    try {
      const data = await fetchMonoStatus(sessionId)

      if (data.ready_to_complete_order) {
        setView("completing")

        if (data.order_id) {
          completeWithOrder(data.order_id)
          return
        }

        await tryPlaceOrder(data)
        return
      }

      if (data.failed) {
        setFailureReason(data.failure_reason ?? null)
        setView("failed")
        return
      }

      pollCount.current += 1
      if (pollCount.current >= MAX_POLLS) {
        setView("timeout")
        return
      }

      setTimeout(runPoll, POLL_INTERVAL_MS)
    } catch {
      pollCount.current += 1
      if (pollCount.current >= MAX_POLLS) {
        setView("timeout")
        return
      }
      setTimeout(runPoll, POLL_INTERVAL_MS)
    }
  }, [sessionId, completeWithOrder, tryPlaceOrder])

  useEffect(() => {
    cancelled.current = false
    runPoll()
    return () => {
      cancelled.current = true
    }
  }, [runPoll])

  useEffect(() => {
    if (view !== "timeout" && view !== "error") return
    fetchMonoStatus(sessionId)
      .then((data) => {
        if (data.order_id) setOrderId(data.order_id)
      })
      .catch(() => {})
  }, [view, sessionId])

  if (view === "checking" || view === "completing") {
    return (
      <>
        <div
          className="h-10 w-10 rounded-full border-2 border-navy border-t-transparent animate-spin"
          aria-hidden
        />
        <Heading level="h2">
          {view === "completing"
            ? "Оплату підтверджено, оформлюємо замовлення..."
            : "Перевіряємо статус оплати..."}
        </Heading>
        <Text className="text-graphite max-w-md">
          Це займає лише кілька секунд. Не закривайте цю сторінку.
        </Text>
      </>
    )
  }

  if (view === "failed") {
    return (
      <>
        <Heading level="h2">Оплату не вдалося завершити</Heading>
        <Text className="text-graphite max-w-md">
          {failureReason ||
            "Платіж не пройшов або час дії посилання на оплату закінчився."}
        </Text>
        <LocalizedClientLink href="/checkout?step=payment">
          <Button size="large">Спробувати ще раз</Button>
        </LocalizedClientLink>
      </>
    )
  }

  return (
    <>
      <Heading level="h2">
        Підтверджуємо оплату — це займає трохи довше, ніж зазвичай
      </Heading>
      <Text className="text-graphite max-w-md">
        Якщо оплата пройшла успішно, замовлення з&apos;явиться найближчим
        часом. Ми надішлемо підтвердження на вашу пошту.
      </Text>
      <div className="flex gap-x-4">
        <Button
          size="large"
          variant="secondary"
          onClick={() => {
            pollCount.current = 0
            setView("checking")
            runPoll()
          }}
        >
          Перевірити ще раз
        </Button>
        {orderId ? (
          <LocalizedClientLink href={`/order/${orderId}/confirmed`}>
            <Button size="large">Переглянути замовлення</Button>
          </LocalizedClientLink>
        ) : (
          <LocalizedClientLink href="/">
            <Button size="large">На головну</Button>
          </LocalizedClientLink>
        )}
      </div>
    </>
  )
}
