import { MedusaService } from "@medusajs/framework/utils"
import PageContentBlock from "./models/page-content-block"

type SetBlockInput = {
  page: string
  block_key: string
  content: Record<string, unknown>
}

class PageContentModuleService extends MedusaService({
  PageContentBlock,
}) {
  
  async setBlock({ page, block_key, content }: SetBlockInput) {
    const [existing] = await this.listPageContentBlocks({
      page,
      block_key,
    })

    if (existing) {
      return await this.updatePageContentBlocks({
        id: existing.id,
        content,
      })
    }

    return await this.createPageContentBlocks({
      page,
      block_key,
      content,
    })
  }
}

export default PageContentModuleService
