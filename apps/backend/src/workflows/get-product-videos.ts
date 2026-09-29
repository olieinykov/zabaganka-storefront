import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { getProductVideosStep } from "./steps/product-video-steps"

export type GetProductVideosWorkflowInput = {
  product_id: string
}

export const getProductVideosWorkflow = createWorkflow(
  "get-product-videos",
  (input: GetProductVideosWorkflowInput) => {
    const videos = getProductVideosStep(input)
    return new WorkflowResponse(videos)
  }
)
