import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../../../lib/notify-storefront-revalidate"
import { serializePackagingVariant, PACKAGING_CACHE_TAG } from "../../../../../lib/packaging"
import { createPackagingVariantWorkflow } from "../../../../../workflows/packaging"
import type { AdminCreatePackagingVariantType } from "../../validators"

/**
 * POST /admin/packagings/:id/variants
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminCreatePackagingVariantType>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await createPackagingVariantWorkflow(req.scope).run({
    input: { ...req.validatedBody, packaging_id: req.params.id },
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ variant: serializePackagingVariant(result) })
}
