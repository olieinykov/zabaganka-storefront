import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteProductVideoWorkflow } from "../../../../../../workflows/delete-product-video"

/**
 * DELETE /admin/products/:id/videos/:video_id
 *
 * Detaches the video from the product and removes the file from storage.
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  await deleteProductVideoWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      video_id: req.params.video_id,
    },
  })

  res.json({
    id: req.params.video_id,
    object: "product_video",
    deleted: true,
  })
}
