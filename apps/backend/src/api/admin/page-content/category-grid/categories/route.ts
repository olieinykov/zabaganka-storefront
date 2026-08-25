import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PAGE_CONTENT_MODULE } from "../../../../../modules/page-content"
import PageContentModuleService from "../../../../../modules/page-content/service"

type SavedCategoryImage = {
  category_id: string
  image_url: string | null
  image_alt: string
}


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const page = (req.query.page as string | undefined) || "home"

  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  const categories = await productModuleService.listProductCategories(
    { parent_category_id: null },
    { select: ["id", "name"], order: { created_at: "ASC" } }
  )

  const pageContentService: PageContentModuleService = req.scope.resolve(
    PAGE_CONTENT_MODULE
  )
  const [block] = await pageContentService.listPageContentBlocks({
    page,
    block_key: "category_grid",
  })
  const savedImages: SavedCategoryImage[] =
    (block?.content as any)?.images ?? []
  const savedByCategoryId = new Map(
    savedImages.map((image) => [image.category_id, image])
  )

  res.json({
    categories: categories.map((category) => {
      const saved = savedByCategoryId.get(category.id)
      return {
        category_id: category.id,
        name: category.name,
        image_url: saved?.image_url ?? null,
        image_alt: saved?.image_alt ?? "",
      }
    }),
  })
}