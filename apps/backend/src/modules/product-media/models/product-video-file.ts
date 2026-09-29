import { model } from "@medusajs/framework/utils"

const ProductVideoFile = model
  .define("product_video_file", {
    id: model.id({ prefix: "pvid" }).primaryKey(),
    url: model.text(),
    file_id: model.text(),
    mime_type: model.text().nullable(),
    rank: model.number().default(0),
  })
  .indexes([{ on: ["url"] }])

export default ProductVideoFile
