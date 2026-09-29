import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  deleteFilesWorkflow,
  dismissRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import { PRODUCT_VIDEOS_CHANGED_EVENT } from "../lib/product-video"
import { PRODUCT_MEDIA_MODULE } from "../modules/product-media"
import {
  getProductVideosStep,
  ProductVideoRecord,
  softDeleteProductVideosStep,
} from "./steps/product-video-steps"

export type DeleteProductVideoWorkflowInput = {
  product_id: string
  video_id: string
}

const findProductVideoStep = createStep(
  "find-product-video",
  async (input: { videos: ProductVideoRecord[]; video_id: string }) => {
    const video = input.videos.find((v) => v.id === input.video_id)
    if (!video) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Video with id "${input.video_id}" was not found for this product`
      )
    }

    return new StepResponse(video)
  }
)

export const deleteProductVideoWorkflow = createWorkflow(
  "delete-product-video",
  (input: DeleteProductVideoWorkflowInput) => {
    const videos = getProductVideosStep({ product_id: input.product_id })
    const video = findProductVideoStep({ videos, video_id: input.video_id })

    const link = transform({ input, video }, ({ input, video }) => [
      {
        [Modules.PRODUCT]: { product_id: input.product_id },
        [PRODUCT_MEDIA_MODULE]: { product_video_file_id: video.id },
      },
    ])
    dismissRemoteLinkStep(link)

    const ids = transform({ video }, ({ video }) => [video.id])
    softDeleteProductVideosStep(ids)

    const fileIds = transform({ video }, ({ video }) => [video.file_id])
    deleteFilesWorkflow.runAsStep({ input: { ids: fileIds } })

    emitEventStep({
      eventName: PRODUCT_VIDEOS_CHANGED_EVENT,
      data: { product_id: input.product_id },
    })

    return new WorkflowResponse(video)
  }
)
