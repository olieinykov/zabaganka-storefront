import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PAGE_CONTENT_MODULE } from "../modules/page-content"
import PageContentModuleService from "../modules/page-content/service"

export type UpsertPageContentBlockInput = {
  page: string
  block_key: string
  content: Record<string, unknown>
}

type CompensationData = {
  page: string
  block_key: string
  previousContent: Record<string, unknown> | null
}

const upsertPageContentBlockStep = createStep(
  "upsert-page-content-block-step",
  async (input: UpsertPageContentBlockInput, { container }) => {
    const service: PageContentModuleService = container.resolve(
      PAGE_CONTENT_MODULE
    )

    const [existing] = await service.listPageContentBlocks({
      page: input.page,
      block_key: input.block_key,
    })

    const block = await service.setBlock(input)

    return new StepResponse<typeof block, CompensationData>(block, {
      page: input.page,
      block_key: input.block_key,
      previousContent: existing ? existing.content : null,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const { page, block_key, previousContent } = compensationData
    const service: PageContentModuleService = container.resolve(
      PAGE_CONTENT_MODULE
    )

    const [current] = await service.listPageContentBlocks({
      page,
      block_key,
    })
    if (!current) {
      return
    }

    if (previousContent) {
      await service.updatePageContentBlocks({
        id: current.id,
        content: previousContent,
      })
    } else {
      await service.deletePageContentBlocks(current.id)
    }
  }
)

export const upsertPageContentBlockWorkflow = createWorkflow(
  "upsert-page-content-block",
  (input: UpsertPageContentBlockInput) => {
    const block = upsertPageContentBlockStep(input)
    return new WorkflowResponse(block)
  }
)
