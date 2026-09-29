import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getProductVideosWorkflow } from "../../../../../../workflows/get-product-videos"
import { reorderProductVideosWorkflow } from "../../../../../../workflows/reorder-product-videos"
import type { AdminReorderProductVideosType } from "../validators"

/**
 * POST /admin/products/:id/videos/reorder
 *
 * Body: `{ positions: { id: string, rank: number }[] }` - the new position of
 * every video of the product in the combined gallery (photos + videos).
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminReorderProductVideosType>,
  res: MedusaResponse
): Promise<void> {
  await reorderProductVideosWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      positions: req.validatedBody.positions,
    },
  })

  const { result: videos } = await getProductVideosWorkflow(req.scope).run({
    input: { product_id: req.params.id },
  })

  res.json({ videos })
}
