import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { removeRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { PACKAGING_MODULE } from "../modules/packaging"
import {
  createPackagingStep,
  DefaultPackagingInput,
  upsertDefaultPackagingStep,
  createPackagingVariantStep,
  listPackagingVariantIdsStep,
  PackagingInput,
  PackagingVariantInput,
  softDeletePackagingStep,
  softDeletePackagingVariantStep,
  updatePackagingStep,
  updatePackagingVariantStep,
} from "./steps/packaging-steps"

export const createPackagingWorkflow = createWorkflow(
  "create-packaging",
  (input: PackagingInput) => {
    const packaging = createPackagingStep(input)
    return new WorkflowResponse(packaging)
  }
)

export const updatePackagingWorkflow = createWorkflow(
  "update-packaging",
  (input: Partial<PackagingInput> & { id: string }) => {
    const packaging = updatePackagingStep(input)
    return new WorkflowResponse(packaging)
  }
)

export const deletePackagingWorkflow = createWorkflow(
  "delete-packaging",
  (input: { id: string }) => {
    const variantIds = listPackagingVariantIdsStep({ packaging_id: input.id })

    removeRemoteLinkStep({
      [PACKAGING_MODULE]: { packaging_variant_id: variantIds },
    })

    softDeletePackagingStep(input.id)

    return new WorkflowResponse(input.id)
  }
)

export const createPackagingVariantWorkflow = createWorkflow(
  "create-packaging-variant",
  (input: PackagingVariantInput & { packaging_id: string }) => {
    const variant = createPackagingVariantStep(input)
    return new WorkflowResponse(variant)
  }
)

export type UpdatePackagingVariantWorkflowInput = {
  id: string
  packaging_id: string
  update: Partial<PackagingVariantInput>
}

export const updatePackagingVariantWorkflow = createWorkflow(
  "update-packaging-variant",
  (input: UpdatePackagingVariantWorkflowInput) => {
    const variant = updatePackagingVariantStep(input)
    return new WorkflowResponse(variant)
  }
)

export const deletePackagingVariantWorkflow = createWorkflow(
  "delete-packaging-variant",
  (input: { id: string; packaging_id: string }) => {
    softDeletePackagingVariantStep(input)

    removeRemoteLinkStep({
      [PACKAGING_MODULE]: { packaging_variant_id: input.id },
    })

    return new WorkflowResponse(input.id)
  }
)

export const upsertDefaultPackagingWorkflow = createWorkflow(
  "upsert-default-packaging",
  (input: DefaultPackagingInput) => {
    const packaging = upsertDefaultPackagingStep(input)
    return new WorkflowResponse(packaging)
  }
)
