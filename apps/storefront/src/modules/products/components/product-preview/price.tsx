import { clx } from "@modules/common/components/ui"
import { VariantPrice } from "../../../../types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  return (
    <div className="flex flex-col">
      {price.price_type === "sale" && (
        <span
          className="text-xs line-through text-graphite"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
      <span
        className={clx("text-sm font-semibold text-navy", {
          "text-gold": price.price_type === "sale",
        })}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </div>
  )
}
