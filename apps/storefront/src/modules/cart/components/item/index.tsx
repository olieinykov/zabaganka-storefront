"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  isLine?: boolean
}

const Item = ({ item, type = "full", currencyCode, isLine = false }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // How many units the store actually has on hand for this variant, used
  // to cap the quantity dropdown so a customer can't select more than
  // what's in stock. When inventory isn't tracked for this variant, or
  // backorders are allowed, there's no real stock ceiling to enforce, so
  // we fall back to a flat UI cap instead (so the dropdown doesn't turn
  // into an unbounded list for high-stock/untracked items).
  const QUANTITY_DROPDOWN_CEILING = 10

  // 1. Считаем сумму доступного остатка по всем локациям инвентаря
  const inventoryItems = (item.variant as any)?.inventory_items
  const inventoryQuantity = Array.isArray(inventoryItems)
    ? inventoryItems.reduce((acc: number, link: any) => {
        const levels = link.inventory?.location_levels ?? []
        const sumLevels = levels.reduce(
          (sum: number, lvl: any) =>
            sum + (lvl.available_quantity ?? lvl.stocked_quantity ?? 0),
          0
        )
        return acc + sumLevels
      }, 0)
    : undefined
console.log("Inventory items debug:", {
  inventory_items: (item.variant as any)?.inventory_items,
  calculatedQuantity: inventoryQuantity,
})
  // 2. Определяем лимит для выбора
  const trackedStock =
    item.variant?.manage_inventory && !item.variant?.allow_backorder && inventoryQuantity !== undefined
      ? inventoryQuantity
      : undefined

  const maxQuantity =
    trackedStock !== undefined
      ? Math.max(1, Math.min(trackedStock, QUANTITY_DROPDOWN_CEILING))
      : QUANTITY_DROPDOWN_CEILING

  const quantityOptions = Array.from(
    { length: maxQuantity },
    (_, i) => i + 1
  )
  if (item.quantity > maxQuantity) {
    quantityOptions.push(item.quantity)
  }

  return (
    <Table.Row 
      className={clx("w-full", {
        "max-[470px]:flex max-[470px]:flex-wrap max-[470px]:py-4": !isLine,
      })}
      data-testid="product-row"
    >
      <Table.Cell 
        className={clx("!pl-0 p-4 w-24", {
          "max-[470px]:!p-0 max-[470px]:w-auto max-[470px]:!pr-4": !isLine,
        })}
      >
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell 
        className={clx("text-left max-w-0 w-full", {
          "max-[470px]:max-w-none max-[470px]:flex-1 max-[470px]:!p-0": !isLine,
        })}
      >
        <Text
          className="txt-medium-plus text-ui-fg-base truncate block max-[645px]:whitespace-normal max-[645px]:overflow-visible max-[645px]:break-words"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell 
          className={clx({
            "max-[470px]:w-full max-[470px]:block max-[470px]:!p-0 max-[470px]:mt-4": !isLine,
          })}
        >
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {quantityOptions.map((qty) => (
                <option value={qty} key={qty}>
                  {qty}
                </option>
              ))}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell 
        className={clx("!pr-0 whitespace-nowrap", {
          "max-[470px]:w-full max-[470px]:block max-[470px]:!p-0 max-[470px]:mt-3 max-[470px]:pt-3": !isLine,
        })}
      >
        <div
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
            "max-[470px]:flex-row max-[470px]:justify-between max-[470px]:items-center": type === "preview" && !isLine,
            "max-[470px]:flex max-[470px]:justify-start": type === "full" && !isLine,
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 text-sm text-ui-fg-muted">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <span 
            className={clx("text-ui-fg-base", {
              "max-[470px]:text-base max-[470px]:font-semibold": !isLine,
            })}
          >
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item