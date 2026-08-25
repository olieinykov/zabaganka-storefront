import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAGE_CONTENT_MODULE } from "../../../modules/page-content"
import PageContentModuleService from "../../../modules/page-content/service"
import {
  PAGE_BLOCKS,
  PageKey,
  getBlockDefault,
  isValidPage,
} from "../../../modules/page-content/block-definitions"


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const page = (req.query.page as string | undefined) || "home"

  if (!isValidPage(page)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown page "${page}"`
    )
  }

  const service: PageContentModuleService = req.scope.resolve(
    PAGE_CONTENT_MODULE
  )

  const existing = await service.listPageContentBlocks({ page })
  const existingByKey = new Map(existing.map((b) => [b.block_key, b.content]))

  const blocks: Record<string, unknown> = {}
  for (const block_key of PAGE_BLOCKS[page as PageKey] as readonly string[]) {
    blocks[block_key] =
      existingByKey.get(block_key) ?? getBlockDefault(block_key as any)
  }

  res.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300")
  res.json({ page, blocks })
}
