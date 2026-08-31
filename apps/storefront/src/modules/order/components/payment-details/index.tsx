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
  const payment = order.payment_collections?.[0].payments?.[0]

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
            <div className="flex flex-col w-1/3">
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
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Платіжні реквізити
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} сплачено о ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
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
