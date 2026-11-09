import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  getOfferedPackagingVariants,
  PackagingVariantRecord,
  PRODUCT_PACKAGING_FIELDS,
  serializeDefaultPackaging,
  toStorePackagingOption,
} from "../../../lib/packaging"
import { PACKAGING_MODULE } from "../../../modules/packaging"
import PackagingModuleService from "../../../modules/packaging/service"

const MAX_PRODUCTS = 50

function readProductIds(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  return Array.from(
    new Set(
      raw
        .flatMap((entry) => String(entry).split(","))
        .map((id) => id.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_PRODUCTS)
}

/**
 * GET /store/packaging-options?product_id=prod_1&product_id=prod_2
 *
 * The paid packaging variants (packaging + size + price) a customer can
 * choose for each product: the variants assigned to the product that are
 * available, with an available packaging. Products with nothing to offer get an empty list, so
 * the storefront hides the "add packaging" button. `default` is the free
 * branded packaging shown as the pre-selected choice.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service: PackagingModuleService = req.scope.resolve(PACKAGING_MODULE)
  const [defaultRow] = await service.listPackagingDefaults({}, { take: 1 })
  const defaultPackaging = serializeDefaultPackaging(defaultRow)

  const productIds = readProductIds(req.query.product_id)
  if (!productIds.length) {
    res.json({ default: defaultPackaging, products: [] })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", ...PRODUCT_PACKAGING_FIELDS],
    filters: { id: productIds, status: "published" },
  })

  const products = (
    data as unknown as {
      id: string
      packaging_variants?: (PackagingVariantRecord | null)[] | null
    }[]
  ).map((product) => ({
    product_id: product.id,
    options: getOfferedPackagingVariants(product).map(toStorePackagingOption),
  }))

  res.json({ default: defaultPackaging, products })
}
