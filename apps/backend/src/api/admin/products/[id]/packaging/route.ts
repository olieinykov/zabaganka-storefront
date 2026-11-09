import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../../../lib/notify-storefront-revalidate"
import { PACKAGING_CACHE_TAG } from "../../../../../lib/packaging"
import { setProductPackagingWorkflow } from "../../../../../workflows/set-product-packaging"
import { getProductPackagingWorkflow } from "../../../../../workflows/get-product-packaging"
import type { AdminSetProductPackagingType } from "../../../packagings/validators"

/**
 * GET /admin/products/:id/packaging
 *
 * Which packaging variants are assigned to the product.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result } = await getProductPackagingWorkflow(req.scope).run({
    input: { product_id: req.params.id },
  })

  res.json({ packaging: result })
}

/**
 * POST /admin/products/:id/packaging
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminSetProductPackagingType>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await setProductPackagingWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      variant_ids: req.validatedBody.variant_ids,
    },
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ packaging: result })
}
