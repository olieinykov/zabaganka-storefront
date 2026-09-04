import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAGE_CONTENT_MODULE } from "../../../../modules/page-content"
import PageContentModuleService from "../../../../modules/page-content/service"
import { upsertPageContentBlockWorkflow } from "../../../../workflows/upsert-page-content-block"
import { notifyStorefrontRevalidate } from "../../../../lib/notify-storefront-revalidate"
import {
  HomeBlockKey,
  PageKey,
  getBlockDefault,
  getBlockSchema,
  isValidBlockKey,
  isValidPage,
} from "../../../../modules/page-content/block-definitions"

function resolvePageAndBlock(req: MedusaRequest) {
  const page = ((req.query.page as string | undefined) || "home") as string
  const block_key = req.params.block_key

  if (!isValidPage(page)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown page "${page}"`
    )
  }
  if (!isValidBlockKey(page as PageKey, block_key)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown block "${block_key}" for page "${page}"`
    )
  }

  return { page: page as PageKey, block_key: block_key as HomeBlockKey }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { page, block_key } = resolvePageAndBlock(req)

  const service: PageContentModuleService = req.scope.resolve(
    PAGE_CONTENT_MODULE
  )

  const [row] = await service.listPageContentBlocks({ page, block_key })

  res.json({
    block: {
      page,
      block_key,
      content: row ? row.content : getBlockDefault(block_key),
      updated_at: row?.updated_at ?? null,
      is_customized: !!row,
    },
  })
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { page, block_key } = resolvePageAndBlock(req)

  const schema = getBlockSchema(block_key)
  const parsed = schema.safeParse(req.body)

  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid content for block "${block_key}": ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    )
  }

  const { result: row } = await upsertPageContentBlockWorkflow(req.scope).run(
    {
      input: { page, block_key, content: parsed.data },
    }
  )

  void notifyStorefrontRevalidate(`page-content-${page}`)

  res.json({
    block: {
      page,
      block_key,
      content: row.content,
      updated_at: row.updated_at,
      is_customized: true,
    },
  })
}
