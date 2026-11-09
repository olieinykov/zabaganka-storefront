import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getProductPackagingStep } from "./steps/packaging-steps"

export const getProductPackagingWorkflow = createWorkflow(
  "get-product-packaging",
  (input: { product_id: string }) => {
    const packaging = getProductPackagingStep(input)
    return new WorkflowResponse(packaging)
  }
)
