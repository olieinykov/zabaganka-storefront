import { listProducts } from "@lib/data/products"
import { PackagingData } from "@lib/util/packaging"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions
 * component. Packaging comes from the page (cached), so the Suspense
 * fallback can already show it.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  initialVariantId,
  packaging,
}: {
  id: string
  region: HttpTypes.StoreRegion
  initialVariantId?: string
  packaging: PackagingData
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
    fresh: true,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  return (
    <ProductActions
      product={product}
      region={region}
      initialVariantId={initialVariantId}
      packagingOptions={packaging.byProduct[id] ?? []}
      defaultPackaging={packaging.defaultPackaging}
    />
  )
}