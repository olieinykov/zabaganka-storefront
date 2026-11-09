import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../../lib/notify-storefront-revalidate"
import { serializePackaging, PACKAGING_CACHE_TAG } from "../../../../lib/packaging"
import { PACKAGING_MODULE } from "../../../../modules/packaging"
import PackagingModuleService from "../../../../modules/packaging/service"
import {
  deletePackagingWorkflow,
  updatePackagingWorkflow,
} from "../../../../workflows/packaging"
import type { AdminUpdatePackagingType } from "../validators"

async function retrievePackaging(req: AuthenticatedMedusaRequest) {
  const service: PackagingModuleService = req.scope.resolve(PACKAGING_MODULE)
  const packaging = await service.retrievePackagingOption(req.params.id, {
    relations: ["variants"],
  })
  return serializePackaging(packaging)
}

/**
 * GET /admin/packagings/:id
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.json({ packaging: await retrievePackaging(req) })
}

/**
 * POST /admin/packagings/:id
 *
 * Changes are not copied into carts right away: packaged cart lines are
 * re-checked before a payment session starts (see the payment-sessions
 * middleware).
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpdatePackagingType>,
  res: MedusaResponse
): Promise<void> {
  await updatePackagingWorkflow(req.scope).run({
    input: { ...req.validatedBody, id: req.params.id },
  })

  // Product pages cache packaging under this tag.
  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ packaging: await retrievePackaging(req) })
}

/**
 * DELETE /admin/packagings/:id
 *
 * Also deletes the variants and unassigns them from every product.
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  await deletePackagingWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ id: req.params.id, object: "packaging", deleted: true })
}
