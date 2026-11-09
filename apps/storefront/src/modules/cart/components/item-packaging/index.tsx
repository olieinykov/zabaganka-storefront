"use client"

import { changeLineItemPackaging } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import {
  DefaultPackaging,
  formatDimensions,
  getLineItemPackaging,
  PackagingOption,
} from "@lib/util/packaging"
import ErrorMessage from "@modules/checkout/components/error-message"
import PackagingModal from "@modules/common/components/packaging-modal"
import Spinner from "@modules/common/icons/spinner"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

type ItemPackagingProps = {
  item: HttpTypes.StoreCartLineItem
  options: PackagingOption[]
  defaultPackaging: DefaultPackaging
  currencyCode: string
}

const ItemPackaging = ({
  item,
  options,
  defaultPackaging,
  currencyCode,
}: ItemPackagingProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const packaging = getLineItemPackaging(item)
  const isUnavailable =
    !!packaging && !options.some((option) => option.id === packaging.variant_id)

  if (!packaging && !options.length) {
    return null
  }

  const change = async (packagingVariantId: string | null) => {
    setIsOpen(false)
    if (packagingVariantId === (packaging?.variant_id ?? null)) {
      return
    }

    setError(null)
    setUpdating(true)
    const result = await changeLineItemPackaging({
      lineId: item.id,
      packagingVariantId,
    }).catch(() => ({
      error: "Не вдалося змінити пакування. Спробуйте ще раз.",
    }))
    setUpdating(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div
      className="mt-1 flex flex-col gap-y-2 whitespace-normal"
      data-testid="cart-item-packaging"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 txt-medium text-ui-fg-subtle">
        <span>
          Пакування:{" "}
          {packaging ? (
            <>
              {packaging.title} ({formatDimensions(packaging)}) · +
              {convertToLocale({
                amount: packaging.unit_price,
                currency_code: currencyCode,
              })}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </>
          ) : (
            `${defaultPackaging.title} (безкоштовно)`
          )}
        </span>
        {!!options.length && (
          <button
            type="button"
            className="text-ui-fg-interactive hover:underline disabled:opacity-50"
            onClick={() => setIsOpen(true)}
            disabled={updating}
            data-testid="cart-item-packaging-change"
          >
            {packaging ? "Змінити" : "Додати пакування"}
          </button>
        )}
        {packaging && (
          <button
            type="button"
            className="hover:underline disabled:opacity-50"
            onClick={() => change(null)}
            disabled={updating}
            data-testid="cart-item-packaging-remove"
          >
            Скасувати
          </button>
        )}
        {updating && <Spinner />}
      </div>

      {isUnavailable && (
        <span className="txt-medium text-brand-error">
          Це пакування більше недоступне. Оберіть інше або фірмове пакування.
        </span>
      )}

      {!!options.length && (
        <PackagingModal
          isOpen={isOpen}
          close={() => setIsOpen(false)}
          options={options}
          defaultPackaging={defaultPackaging}
          selectedId={isUnavailable ? null : packaging?.variant_id ?? null}
          onSelect={change}
          currencyCode={currencyCode}
          disabled={updating}
        />
      )}

      <ErrorMessage error={error} data-testid="cart-item-packaging-error" />
    </div>
  )
}

export default ItemPackaging
