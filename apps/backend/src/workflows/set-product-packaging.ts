import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
} from "@medusajs/medusa/core-flows"
import { PACKAGING_MODULE } from "../modules/packaging"
import {
  getProductPackagingStep,
  validatePackagingVariantIdsStep,
} from "./steps/packaging-steps"

export type SetProductPackagingWorkflowInput = {
  product_id: string
  variant_ids: string[]
}

export const setProductPackagingWorkflow = createWorkflow(
  "set-product-packaging",
  (input: SetProductPackagingWorkflowInput) => {
    const variantIds = transform({ input }, ({ input }) =>
      Array.from(new Set(input.variant_ids))
    )
    validatePackagingVariantIdsStep(variantIds)

    const current = getProductPackagingStep({ product_id: input.product_id })

    const diff = transform(
      { input, current, variantIds },
      ({ input, current, variantIds }) => {
        const toLink = (id: string) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [PACKAGING_MODULE]: { packaging_variant_id: id },
        })

        return {
          toAdd: variantIds
            .filter((id) => !current.variant_ids.includes(id))
            .map(toLink),
          toRemove: current.variant_ids
            .filter((id) => !variantIds.includes(id))
            .map(toLink),
        }
      }
    )

    const toRemove = transform({ diff }, ({ diff }) => diff.toRemove)
    const toAdd = transform({ diff }, ({ diff }) => diff.toAdd)
    dismissRemoteLinkStep(toRemove)
    createRemoteLinkStep(toAdd)

    const result = getProductPackagingStep({
      product_id: input.product_id,
    }).config({ name: "get-product-packaging-after" })

    return new WorkflowResponse(result)
  }
)
