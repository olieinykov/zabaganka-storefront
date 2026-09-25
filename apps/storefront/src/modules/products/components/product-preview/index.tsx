import { getProductPrice } from "@lib/util/get-product-price"
import { isProductFullyOutOfStock } from "@lib/util/product"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuickAddButton from "@modules/products/components/quick-add-button"
import WishlistButton from "@modules/products/components/wishlist-button"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  badge,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  /** Small label chip shown in the top-left corner of the image, e.g. "Новинка" */
  badge?: string
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const categoryName = product.categories?.[0]?.name
  const outOfStock = isProductFullyOutOfStock(product)

  return (
    <div data-testid="product-wrapper" className="group flex flex-col h-full">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="relative block"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          className={outOfStock ? "opacity-60 grayscale-[35%]" : undefined}
        />
        {outOfStock ? (
          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-ui-fg-muted">
            Немає в наявності
          </span>
        ) : (
          badge && (
            <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase text-ink">
              {badge}
            </span>
          )
        )}
        <WishlistButton
          productId={product.id}
          productTitle={product.title}
          className="absolute top-3 right-3"
        />
      </LocalizedClientLink>

      <div className="flex flex-col gap-1 mt-3 flex-1">
        {categoryName && (
          <span className="text-[11px] uppercase tracking-wide text-graphite">
            {categoryName}
          </span>
        )}
        <div className="flex flex-col gap-1 small:flex-row small:items-start small:justify-between small:gap-2">
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <h3
              className="font-display text-lg leading-snug text-navy hover:text-gold interactive"
              data-testid="product-title"
            >
              {product.title}
            </h3>
          </LocalizedClientLink>
          {cheapestPrice && (
            <div className="shrink-0 small:pt-0.5">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <QuickAddButton product={product} />
      </div>
    </div>
  )
}