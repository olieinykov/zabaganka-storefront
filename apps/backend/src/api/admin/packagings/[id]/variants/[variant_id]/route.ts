import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../../../../lib/notify-storefront-revalidate"
import { serializePackagingVariant, PACKAGING_CACHE_TAG } from "../../../../../../lib/packaging"
import {
  deletePackagingVariantWorkflow,
  updatePackagingVariantWorkflow,
} from "../../../../../../workflows/packaging"
import type { AdminUpdatePackagingVariantType } from "../../../validators"

/**
 * POST /admin/packagings/:id/variants/:variant_id
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpdatePackagingVariantType>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await updatePackagingVariantWorkflow(req.scope).run({
    input: {
      id: req.params.variant_id,
      packaging_id: req.params.id,
      update: req.validatedBody,
    },
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ variant: serializePackagingVariant(result) })
}

/**
 * DELETE /admin/packagings/:id/variants/:variant_id
 *
 * Also unassigns the variant from every product.
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  await deletePackagingVariantWorkflow(req.scope).run({
    input: { id: req.params.variant_id, packaging_id: req.params.id },
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({
    id: req.params.variant_id,
    object: "packaging_variant",
    deleted: true,
  })
}
