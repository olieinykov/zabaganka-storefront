import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import SectionHeading from "@modules/home/components/section-heading"

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
  /** Small label chip rendered on each card, e.g. "Новинка" */
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
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit, ...(sortBy ? { order: sortBy } : {}) },
  })

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
      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 small:grid-cols-4 gap-x-4 gap-y-8 small:gap-x-6">
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
