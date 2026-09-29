import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import { PRODUCT_VIDEOS_CHANGED_EVENT } from "../lib/product-video"
import { PRODUCT_MEDIA_MODULE } from "../modules/product-media"
import {
  createProductVideosStep,
  getProductImageCountStep,
  getProductVideosStep,
} from "./steps/product-video-steps"

export type CreateProductVideosWorkflowInput = {
  product_id: string
  videos: {
    url: string
    file_id: string
    mime_type?: string | null
  }[]
}

export const createProductVideosWorkflow = createWorkflow(
  "create-product-videos",
  (input: CreateProductVideosWorkflowInput) => {
    const existing = getProductVideosStep({ product_id: input.product_id })
    const imageCount = getProductImageCountStep({
      product_id: input.product_id,
    })

    const toCreate = transform(
      { input, existing, imageCount },
      ({ input, existing, imageCount }) => {
        const maxRank = existing.reduce(
          (max, video) => Math.max(max, video.rank),
          -1
        )
        const start = Math.max(imageCount + existing.length, maxRank + 1)

        return input.videos.map((video, index) => ({
          url: video.url,
          file_id: video.file_id,
          mime_type: video.mime_type ?? null,
          rank: start + index,
        }))
      }
    )

    const videos = createProductVideosStep(toCreate)

    const links = transform({ input, videos }, ({ input, videos }) =>
      videos.map((video) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [PRODUCT_MEDIA_MODULE]: { product_video_file_id: video.id },
      }))
    )

    createRemoteLinkStep(links)

    emitEventStep({
      eventName: PRODUCT_VIDEOS_CHANGED_EVENT,
      data: { product_id: input.product_id },
    })

    return new WorkflowResponse(videos)
  }
)
