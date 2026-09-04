import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"


type DeliveryDestination = {
  carrier?: "nova-poshta" | "ukrposhta" | string
  type?: "warehouse" | "postomat" | "courier" | string
  city_name?: string
  warehouse_name?: string
  comment?: string
}

type OrderData = {
  id: string
  metadata?: Record<string, unknown> | null
}

const CARRIER_LABELS: Record<string, string> = {
  "nova-poshta": "Нова пошта",
  ukrposhta: "Укрпошта",
}

const TYPE_LABELS: Record<string, string> = {
  warehouse: "Відділення",
  postomat: "Поштомат",
  courier: "Кур'єр",
}

const OrderDeliveryDestinationWidget = ({ data }: { data?: OrderData }) => {
  const delivery = data?.metadata?.delivery as DeliveryDestination | undefined

  if (!delivery || (!delivery.city_name && !delivery.warehouse_name && !delivery.comment)) {
    return null
  }

  const carrierLabel = delivery.carrier
    ? CARRIER_LABELS[delivery.carrier] ?? delivery.carrier
    : null
  const typeLabel = delivery.type ? TYPE_LABELS[delivery.type] ?? delivery.type : null

  return (
    <Container className="p-6">
      <Heading level="h2">Куди відправляти</Heading>
      <div className="mt-4 flex flex-col gap-y-2">
        {carrierLabel && (
          <div className="flex justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              Перевізник
            </Text>
            <Text size="small">{carrierLabel}</Text>
          </div>
        )}
        {delivery.city_name && (
          <div className="flex justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              Місто
            </Text>
            <Text size="small">{delivery.city_name}</Text>
          </div>
        )}
        {delivery.warehouse_name && (
          <div className="flex justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              {typeLabel ?? "Відділення/поштомат"}
            </Text>
            <Text size="small" className="text-right">
              {delivery.warehouse_name}
            </Text>
          </div>
        )}
        {delivery.comment && (
          <div className="flex justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              Коментар
            </Text>
            <Text size="small" className="text-right">
              {delivery.comment}
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderDeliveryDestinationWidget
