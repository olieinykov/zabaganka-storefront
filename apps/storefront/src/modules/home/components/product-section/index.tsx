import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { isProductInStock } from "@lib/util/product"
import ProductPreview from "@modules/products/components/product-preview"
import SectionHeading from "@modules/home/components/section-heading"
import { PRODUCT_PREVIEW_FIELDS } from "@lib/constants"

const STOCK_FILTER_POOL_MULTIPLIER = 4

export default async function ProductSection({
  eyebrow,
  title,
  linkHref,
  linkLabel,
  badge,
  countryCode,
  sortBy = "created_at",
  limit = 4,
}: {
  eyebrow: string
  title: string
  linkHref: string
  linkLabel: string
  badge?: string
  countryCode: string
  sortBy?: "-created_at" | "created_at"
  limit?: number
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products: pool },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: limit * STOCK_FILTER_POOL_MULTIPLIER,
      fields: PRODUCT_PREVIEW_FIELDS,
      ...(sortBy ? { order: sortBy } : {}),
    },
  })

  if (!pool.length) {
    return null
  }

  const inStockProducts = pool.filter((p) => isProductInStock(p))
  const outOfStockProducts = pool.filter((p) => !isProductInStock(p))

  const products = [...inStockProducts, ...outOfStockProducts].slice(
    0,
    limit
  )

  if (!products.length) {
    return null
  }

  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        linkHref={linkHref}
        linkLabel={linkLabel}
      />
      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 min-[768px]:grid-cols-4 gap-x-4 gap-y-8 small:gap-x-6">
        {products.map((product) => (
          <ProductPreview
            key={product.id}
            product={product}
            region={region}
            badge={badge}
          />
        ))}
      </div>
    </section>
  )
}