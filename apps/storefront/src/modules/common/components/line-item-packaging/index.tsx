import { convertToLocale } from "@lib/util/money"
import { formatDimensions, getLineItemPackaging } from "@lib/util/packaging"
import { clx } from "@modules/common/components/ui"

type LineItemPackagingProps = {
  item: { metadata?: Record<string, unknown> | null; quantity: number }
  currencyCode: string
  className?: string
}

const LineItemPackaging = ({
  item,
  currencyCode,
  className,
}: LineItemPackagingProps) => {
  const packaging = getLineItemPackaging(item)
  if (!packaging) {
    return null
  }

  const price = convertToLocale({
    amount: packaging.unit_price,
    currency_code: currencyCode,
  })

  return (
    <span
      className={clx(
        "block whitespace-normal break-words",
        className ?? "txt-medium text-ui-fg-subtle"
      )}
      data-testid="line-item-packaging"
    >
      Пакування: {packaging.title} ({formatDimensions(packaging)}) · +{price}
      {item.quantity > 1 ? ` × ${item.quantity}` : ""}
    </span>
  )
}

export default LineItemPackaging
