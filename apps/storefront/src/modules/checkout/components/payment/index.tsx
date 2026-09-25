"use client"
import { RadioGroup } from "@headlessui/react"
import { isCod, isMono, isMonoPrepayment, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { isMonoSessionStillPayable } from "@lib/data/mono"
import { fetchPrepaymentSettings } from "@lib/data/checkout-options"
import { convertToLocale } from "@lib/util/money"
// PAYMENT LOGO: restore `CreditCard` here with the payment logo block below.
import { CheckCircleSolid, PencilSquareSolid } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )
  const [prepaymentAmount, setPrepaymentAmount] = useState<number | null>(null)
  const [prepaymentError, setPrepaymentError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      let checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      
      if (checkActiveSession && activeSession && isMono(selectedPaymentMethod)) {
        checkActiveSession = await isMonoSessionStillPayable(activeSession.id)
      }

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

 
  useEffect(() => {
    if (!isMonoPrepayment(selectedPaymentMethod)) {
      setPrepaymentAmount(null)
      setPrepaymentError(null)
      return
    }

    let cancelled = false
    fetchPrepaymentSettings()
      .then(({ amount }) => {
        if (!cancelled) setPrepaymentAmount(amount)
      })
      .catch(() => {
        if (!cancelled) {
          setPrepaymentError(
            "Не вдалося отримати суму передоплати. Спробуйте оновити сторінку."
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedPaymentMethod])

  const formatCartAmount = (amount: number) =>
    convertToLocale({ amount, currency_code: cart.currency_code })
  const summaryProviderId = activeSession?.provider_id
  const paymentDetailsSummary = isStripeLike(summaryProviderId)
    ? cardBrand || "Оплата карткою"
    : isMonoPrepayment(summaryProviderId)
    ? prepaymentAmount !== null
      ? `Передоплата ${formatCartAmount(
          prepaymentAmount
        )} онлайн, решта ${formatCartAmount(
          Math.max((cart.total ?? 0) - prepaymentAmount, 0)
        )} — при отриманні`
      : "Передоплата онлайн, решта — при отриманні"
    : isMono(summaryProviderId)
    ? "Після підтвердження замовлення відкриється сторінка оплати"
    : isCod(summaryProviderId)
    ? `Оплата ${formatCartAmount(cart.total ?? 0)} при отриманні замовлення`
    : null

  return (
    <div className="bg-ivory">
      <div className="flex flex-row items-center justify-between mb-6 gap-x-4">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-center",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Оплата
          {!isOpen && paymentReady && <CheckCircleSolid className="flex-shrink-0" />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex items-center justify-center p-2 sm:p-0"
              data-testid="edit-payment-button"
            >
              <span className="hidden sm:inline">Редагувати</span>
              <PencilSquareSolid className="sm:hidden w-5 h-5" />
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>

              {isMonoPrepayment(selectedPaymentMethod) && (
                <Container className="mt-4 p-4 bg-ui-button-neutral-hover">
                  {prepaymentError ? (
                    <Text className="text-ui-fg-error">{prepaymentError}</Text>
                  ) : prepaymentAmount === null ? (
                    <Text className="text-ui-fg-subtle">
                      Завантаження суми передоплати…
                    </Text>
                  ) : (
                    <div className="flex flex-col gap-y-1">
                      <div className="flex justify-between">
                        <Text className="text-ui-fg-subtle">Загальна сума замовлення</Text>
                        <Text className="txt-medium-plus">
                          {convertToLocale({
                            amount: cart.total ?? 0,
                            currency_code: cart.currency_code,
                          })}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-ui-fg-subtle">Сплатити зараз (передоплата)</Text>
                        <Text className="txt-medium-plus">
                          {convertToLocale({
                            amount: prepaymentAmount,
                            currency_code: cart.currency_code,
                          })}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-ui-fg-subtle">
                          Доплата при отриманні
                        </Text>
                        <Text className="txt-medium-plus">
                          {convertToLocale({
                            amount: Math.max((cart.total ?? 0) - prepaymentAmount, 0),
                            currency_code: cart.currency_code,
                          })}
                        </Text>
                      </div>
                    </div>
                  )}
                </Container>
              )}
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Спосіб оплати
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
               Подарункова карта
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard) ||
              (isMonoPrepayment(selectedPaymentMethod) && !!prepaymentError)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? " Введіть дані картки"
              : "Продовжити перегляд"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex flex-col md:flex-row items-start gap-y-6 md:gap-y-0 gap-x-4 md:gap-x-8 w-full">
              <div className="flex flex-col w-full md:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Спосіб оплати
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              {paymentDetailsSummary && (
              <div className="flex flex-col w-full md:w-2/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Деталі оплати
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  {/* PAYMENT LOGO: provider logos (Plata by mono, card icon) are
                      hidden for now. Restore this block, together with the
                      `CreditCard` import above, to show them again.
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  */}
                  <Text>{paymentDetailsSummary}</Text>
                </div>
              </div>
              )}
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-full md:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Спосіб оплати
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Подарункова карта
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
