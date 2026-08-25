import { model } from "@medusajs/framework/utils"


const PageContentBlock = model.define("page_content_block", {
  id: model.id().primaryKey(),
  page: model.text().default("home"),
  block_key: model.text(),
  content: model.json(),
})
  .indexes([
    {
      on: ["page", "block_key"],
      unique: true,
    },
  ])

export default PageContentBlock
