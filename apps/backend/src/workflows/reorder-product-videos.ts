import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import { PRODUCT_VIDEOS_CHANGED_EVENT } from "../lib/product-video"
import {
  getProductVideosStep,
  ProductVideoRecord,
  updateProductVideoRanksStep,
} from "./steps/product-video-steps"

export type ReorderProductVideosWorkflowInput = {
  product_id: string
  positions: { id: string; rank: number }[]
}

const buildProductVideoRanksStep = createStep(
  "build-product-video-ranks",
  async (input: {
    videos: ProductVideoRecord[]
    positions: { id: string; rank: number }[]
  }) => {
    const currentIds = new Set(input.videos.map((video) => video.id))
    const requestedIds = new Set(input.positions.map((p) => p.id))

    const isSameSet =
      currentIds.size === requestedIds.size &&
      input.positions.length === requestedIds.size &&
      input.positions.every((p) => currentIds.has(p.id))

    if (!isSameSet) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Positions must contain every video of the product exactly once"
      )
    }

    const ranks = new Set(input.positions.map((p) => p.rank))
    if (ranks.size !== input.positions.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Two videos can't share the same position"
      )
    }

    return new StepResponse({
      ranks: input.positions.map(({ id, rank }) => ({ id, rank })),
      previous: input.videos.map((video) => ({
        id: video.id,
        rank: video.rank,
      })),
    })
  }
)

export const reorderProductVideosWorkflow = createWorkflow(
  "reorder-product-videos",
  (input: ReorderProductVideosWorkflowInput) => {
    const videos = getProductVideosStep({ product_id: input.product_id })
    const ranks = buildProductVideoRanksStep({
      videos,
      positions: input.positions,
    })
    const updated = updateProductVideoRanksStep(ranks)

    emitEventStep({
      eventName: PRODUCT_VIDEOS_CHANGED_EVENT,
      data: { product_id: input.product_id },
    })

    return new WorkflowResponse(updated)
  }
)
