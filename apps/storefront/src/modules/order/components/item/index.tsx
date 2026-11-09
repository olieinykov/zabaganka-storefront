import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@modules/common/components/ui"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPackaging from "@modules/common/components/line-item-packaging"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  return (
    <Table.Row 
      className="w-full max-[470px]:flex max-[470px]:flex-wrap max-[470px]:py-4" 
      data-testid="product-row"
    >
      <Table.Cell className="!pl-0 p-4 w-24 max-[470px]:!p-0 max-[470px]:w-auto max-[470px]:!pr-4">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left max-w-0 w-full max-[470px]:max-w-none max-[470px]:flex-1 max-[470px]:!p-0">
        <Text
          className="txt-medium-plus text-ui-fg-base truncate block max-[645px]:whitespace-normal max-[645px]:overflow-visible max-[645px]:break-words"
          data-testid="product-name"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
        <LineItemPackaging item={item} currencyCode={currencyCode} />
      </Table.Cell>

      <Table.Cell className="!pr-0 whitespace-nowrap max-[470px]:w-full max-[470px]:block max-[470px]:!p-0 max-[470px]:mt-3 max-[470px]:pt-3">
        <span className="!pr-0 flex flex-col items-end h-full justify-center max-[470px]:flex-row max-[470px]:justify-between max-[470px]:items-center">
          <span className="flex gap-x-1 text-sm text-ui-fg-muted">
            <Text className="text-ui-fg-muted">
              <span data-testid="product-quantity">{item.quantity}</span>x{" "}
            </Text>
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>

          <span className="text-ui-fg-base max-[470px]:text-base max-[470px]:font-semibold">
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item