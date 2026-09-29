import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createProductVideosWorkflow } from "../../../../../workflows/create-product-videos"
import { getProductVideosWorkflow } from "../../../../../workflows/get-product-videos"
import type { AdminCreateProductVideosType } from "./validators"

/**
 * GET /admin/products/:id/videos
 *
 * Lists the product's videos in display order.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { result: videos } = await getProductVideosWorkflow(req.scope).run({
    input: { product_id: req.params.id },
  })

  res.json({ videos })
}

/**
 * POST /admin/products/:id/videos
 *
 * Attaches files previously uploaded through `/admin/uploads` to the product
 * as videos. Videos live outside `product.images`, so they can never be
 * chosen as the product thumbnail.
 */
export async function POST(
  req: AuthenticatedMedusaRequest<AdminCreateProductVideosType>,
  res: MedusaResponse
): Promise<void> {
  await createProductVideosWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      videos: req.validatedBody.videos,
    },
  })

  const { result: videos } = await getProductVideosWorkflow(req.scope).run({
    input: { product_id: req.params.id },
  })

  res.json({ videos })
}
