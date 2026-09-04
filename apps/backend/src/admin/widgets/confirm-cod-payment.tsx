import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

const MONO_PREPAYMENT_PROVIDER = "pp_mono-prepayment_mono-prepayment"

type OrderData = {
  id: string
  total?: number | string
  payment_collections?: Array<{
    captured_amount?: number | string
    payments?: Array<{ provider_id?: string }>
  }>
}

const ConfirmCodPaymentWidget = ({ data }: { data?: OrderData }) => {
  const queryClient = useQueryClient()
  const order = data
  const isMonoPrepayment = order?.payment_collections?.some((collection) =>
    collection.payments?.some(
      (payment) => payment.provider_id === MONO_PREPAYMENT_PROVIDER
    )
  )
  const capturedAmount = order?.payment_collections?.reduce(
    (sum, collection) => sum + Number(collection.captured_amount ?? 0),
    0
  ) ?? 0
  const isFullyPaid = capturedAmount >= Number(order?.total ?? 0)

  const confirm = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/orders/${order!.id}/confirm-cod-payment`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["orders", "detail", order!.id],
      })
      toast.success("Доплату зараховано", {
        description: "Замовлення повністю оплачено.",
      })
    },
    onError: (error: any) => {
      toast.error("Не вдалося зарахувати доплату", {
        description: error?.message ?? "Спробуйте ще раз.",
      })
    },
  })

  if (!order || !isMonoPrepayment || isFullyPaid) return null

  return (
    <Container className="p-6">
      <Heading level="h2">Доплата при отриманні</Heading>
      <Text size="small" className="mt-2 text-ui-fg-subtle">
        Натискайте кнопку лише після фактичного отримання решти суми від покупця.
        Гроші через mono повторно не списуються.
      </Text>
      <Button
        className="mt-4"
        isLoading={confirm.isPending}
        onClick={() => confirm.mutate()}
      >
        Підтвердити доплату при отриманні
      </Button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default ConfirmCodPaymentWidget
