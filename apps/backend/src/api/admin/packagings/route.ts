import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../lib/notify-storefront-revalidate"
import { serializePackaging, PACKAGING_CACHE_TAG } from "../../../lib/packaging"
import { PACKAGING_MODULE } from "../../../modules/packaging"
import PackagingModuleService from "../../../modules/packaging/service"
import { createPackagingWorkflow } from "../../../workflows/packaging"
import type { AdminCreatePackagingType } from "./validators"

/**
 * GET /admin/packagings
 *
 * Every packaging (available or not) with its variants, in display order.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service: PackagingModuleService = req.scope.resolve(PACKAGING_MODULE)
  const packagings = await service.listPackagingOptions(
    {},
    { relations: ["variants"], order: { created_at: "ASC" } }
  )

  res.json({ packagings: packagings.map(serializePackaging) })
}

/**
 * POST /admin/packagings
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminCreatePackagingType>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await createPackagingWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  // Product pages cache packaging under this tag.
  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ packaging: serializePackaging({ ...result, variants: [] }) })
}
