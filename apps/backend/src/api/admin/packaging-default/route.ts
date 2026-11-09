import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { notifyStorefrontRevalidate } from "../../../lib/notify-storefront-revalidate"
import { serializeDefaultPackaging, PACKAGING_CACHE_TAG } from "../../../lib/packaging"
import { PACKAGING_MODULE } from "../../../modules/packaging"
import PackagingModuleService from "../../../modules/packaging/service"
import { upsertDefaultPackagingWorkflow } from "../../../workflows/packaging"
import type { AdminUpsertDefaultPackagingType } from "../packagings/validators"

/**
 * GET /admin/packaging-default
 *
 * The free branded packaging included in every order (built-in defaults
 * until it is saved once).
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const service: PackagingModuleService = req.scope.resolve(PACKAGING_MODULE)
  const [row] = await service.listPackagingDefaults({}, { take: 1 })

  res.json({ default_packaging: serializeDefaultPackaging(row) })
}

/**
 * POST /admin/packaging-default
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminUpsertDefaultPackagingType>,
  res: MedusaResponse
): Promise<void> {
  const { result } = await upsertDefaultPackagingWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  void notifyStorefrontRevalidate(PACKAGING_CACHE_TAG)

  res.json({ default_packaging: serializeDefaultPackaging(result) })
}
