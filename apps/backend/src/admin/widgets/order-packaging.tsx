import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../lib/sdk"
import {
  formatDimensions,
  formatUah,
  packagingVariantPath,
  useDefaultPackaging,
} from "../lib/use-packaging"

type Numeric = number | string | { value?: string | number; numeric?: number } | null | undefined

type OrderItem = {
  id: string
  thumbnail?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: Numeric
  detail?: { quantity?: Numeric } | null
  metadata?: Record<string, unknown> | null
}

type LinePackaging = {
  variant_id?: string
  packaging_id?: string
  title?: string
  image_url?: string | null
  length?: Numeric
  width?: Numeric
  height?: Numeric
  depth?: Numeric
  unit_price?: Numeric
  base_unit_price?: Numeric
}

function toNumber(value: Numeric): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (value && typeof value === "object") {
    if (typeof value.numeric === "number") return value.numeric
    if (value.value !== undefined) return Number(value.value)
  }
  return NaN
}

function itemQuantity(item: OrderItem): number {
  const fromDetail = toNumber(item.detail?.quantity)
  if (Number.isFinite(fromDetail)) return fromDetail
  const direct = toNumber(item.quantity)
  return Number.isFinite(direct) ? direct : 1
}

function Thumb({ url, size }: { url?: string | null; size: "lg" | "sm" }) {
  const className =
    size === "lg"
      ? "border-ui-border-base h-14 w-14 shrink-0 rounded-md border object-cover"
      : "border-ui-border-base h-10 w-10 shrink-0 rounded-md border object-cover"
  return url ? (
    <img src={url} alt="" className={className} />
  ) : (
    <div className={`${className} border-dashed`} />
  )
}

const OrderPackagingWidget = ({ data }: { data?: { id: string } }) => {
  const { data: resp } = useQuery({
    queryKey: ["order-packaging", data?.id],
    queryFn: () =>
      sdk.client.fetch<{ order: { items?: OrderItem[] } }>(
        `/admin/orders/${data!.id}`,
        {
          query: {
            fields:
              "id,items.id,items.thumbnail,items.product_title,items.variant_title,items.metadata,items.detail.quantity",
          },
        }
      ),
    enabled: !!data?.id,
  })
  const { data: defaultResp } = useDefaultPackaging()
  const defaultPackaging = defaultResp?.default_packaging

  const lines = (resp?.order.items ?? []).map((item) => {
    const packaging = item.metadata?.packaging
    return {
      item,
      quantity: itemQuantity(item),
      packaging:
        packaging && typeof packaging === "object"
          ? (packaging as LinePackaging)
          : null,
    }
  })

  if (!lines.length) {
    return null
  }

  const brandedCount = lines
    .filter((line) => !line.packaging)
    .reduce((sum, line) => sum + line.quantity, 0)
  const paidCount = lines
    .filter((line) => line.packaging)
    .reduce((sum, line) => sum + line.quantity, 0)

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-2 px-6 py-4">
        <Heading level="h2">Пакування</Heading>
        <div className="flex flex-wrap gap-2">
          <Badge size="small" color="grey">
            Фірмове: {brandedCount} шт.
          </Badge>
          <Badge size="small" color={paidCount ? "blue" : "grey"}>
            Додаткове: {paidCount} шт.
          </Badge>
        </div>
        <Text size="xsmall" className="text-ui-fg-subtle">
          Кожну прикрасу пакуємо окремо: одна упаковка на одну штуку. Ціна
          позиції з додатковим пакуванням уже включає його вартість.
        </Text>
      </div>

      {lines.map(({ item, quantity, packaging }) => {
        const packagingPrice = toNumber(packaging?.unit_price)
        const jewelryPrice = toNumber(packaging?.base_unit_price)
        const hasDimensions = Number.isFinite(toNumber(packaging?.width))

        return (
          <div key={item.id} className="flex flex-col gap-y-3 px-6 py-4">
            <div className="flex items-center gap-x-3">
              <Thumb url={item.thumbnail} size="lg" />
              <div className="flex min-w-0 flex-1 flex-col">
                <Text size="base" weight="plus" className="truncate">
                  {item.product_title ?? "Товар"}
                </Text>
                {item.variant_title && (
                  <Text size="small" className="text-ui-fg-subtle truncate">
                    {item.variant_title}
                  </Text>
                )}
              </div>
              <Badge size="small" color={packaging ? "blue" : "grey"}>
                {quantity} шт.
              </Badge>
            </div>

            {packaging ? (
              <div className="bg-ui-bg-subtle flex items-center gap-x-3 rounded-md p-3">
                <Thumb url={packaging.image_url} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Додаткове пакування
                  </Text>
                  {packaging.variant_id && packaging.packaging_id ? (
                    <Link
                      to={packagingVariantPath({
                        id: packaging.variant_id,
                        packaging_id: packaging.packaging_id,
                      })}
                      className="txt-compact-small-plus text-ui-fg-interactive truncate"
                    >
                      {packaging.title}
                    </Link>
                  ) : (
                    <Text size="small" weight="plus" className="truncate">
                      {packaging.title}
                    </Text>
                  )}
                  {hasDimensions && (
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {formatDimensions({
                        length: toNumber(packaging.length ?? packaging.depth),
                        width: toNumber(packaging.width),
                        height: toNumber(packaging.height),
                      })}
                    </Text>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <Text size="small" weight="plus">
                    {quantity} × {formatUah(packagingPrice)}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    разом {formatUah(packagingPrice * quantity)}
                  </Text>
                </div>
              </div>
            ) : (
              <div className="bg-ui-bg-subtle flex items-center gap-x-3 rounded-md p-3">
                <Thumb url={defaultPackaging?.image_url} size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Фірмове пакування
                  </Text>
                  <Text size="small" weight="plus" className="truncate">
                    {defaultPackaging?.title ?? "Фірмове пакування Zabaganka"}
                  </Text>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <Text size="small" weight="plus">
                    {quantity} шт.
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    безкоштовно
                  </Text>
                </div>
              </div>
            )}

            {packaging && Number.isFinite(jewelryPrice) && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                Ціна за 1 шт.: прикраса {formatUah(jewelryPrice)} + пакування{" "}
                {formatUah(packagingPrice)} ={" "}
                {formatUah(jewelryPrice + packagingPrice)}
              </Text>
            )}
          </div>
        )
      })}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderPackagingWidget
