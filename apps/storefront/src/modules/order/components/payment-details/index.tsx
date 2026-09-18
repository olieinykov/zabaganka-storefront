import { Container, Heading, Text } from "@modules/common/components/ui"

import { isMono, isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = async ({ order }: PaymentDetailsProps) => {
  const paymentCollection = order.payment_collections?.[0]
  const payment = paymentCollection?.payments?.[0]
  const total = order.total ?? paymentCollection?.amount ?? payment?.amount ?? 0
  const captured =
    (paymentCollection as unknown as { captured_amount?: number })?.captured_amount ?? 0
  const isFullyCaptured = captured >= total && total > 0
  const isPartiallyCaptured = captured > 0 && !isFullyCaptured
  const formatMoney = (amount: number) =>
    convertToLocale({
      amount,
      currency_code: order.currency_code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const fiscalCheck =
    payment && isMono(payment.provider_id)
      ? await fetch(
          `${BACKEND_URL}/store/payments/mono/fiscal-check?order_id=${encodeURIComponent(
            order.id
          )}`,
          { cache: "no-store" }
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : null

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Оплата
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start max-[520px]:flex-col gap-x-1 max-[520px]:gap-4 w-full">
            <div className="flex flex-col w-1/3 max-[520px]:w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Спосіб оплати
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col w-2/3 max-[520px]:w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Платіжні реквізити
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center max-[520px]:flex-col max-[520px]:items-start">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : isFullyCaptured
                    ? `${convertToLocale({
                        amount: captured,
                        currency_code: order.currency_code,
                      })} сплачено о ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`
                    : isPartiallyCaptured
                    ? `Передоплата ${formatMoney(captured)} сплачена о ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`
                    : `Очікує оплати — до сплати ${convertToLocale({
                        amount: total,
                        currency_code: order.currency_code,
                      })}`}
                </Text>
                {isPartiallyCaptured && (
                  <Text className="text-ui-fg-subtle" data-testid="payment-outstanding">
                    Доплата при отриманні:{" "}
                    {formatMoney(Math.max(total - captured, 0))}
                  </Text>
                )}
              </div>
              {isMono(payment.provider_id) && (
                <a
                  href={`${BACKEND_URL}/store/payments/mono/receipt?order_id=${encodeURIComponent(
                    order.id
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small-regular text-ui-fg-interactive underline mt-2 inline-block"
                >
                  Завантажити квитанцію (PDF)
                </a>
              )}
              {fiscalCheck?.available && (
                <a
                  href={fiscalCheck.tax_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small-regular text-ui-fg-interactive underline mt-1 inline-block"
                >
                  Переглянути фіскальний чек
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails