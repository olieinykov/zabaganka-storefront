import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  removeStaleCartLineItemsStep,
  RemoveStaleCartLineItemsStepInput,
} from "./steps/remove-stale-cart-line-items"


export const removeCartItemsForDeletedProductWorkflow = createWorkflow(
  "remove-cart-items-for-deleted-product",
  (input: RemoveStaleCartLineItemsStepInput) => {
    const result = removeStaleCartLineItemsStep(input)

    return new WorkflowResponse(result)
  }
)