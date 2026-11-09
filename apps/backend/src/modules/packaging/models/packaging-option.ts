import { model } from "@medusajs/framework/utils"
import PackagingVariant from "./packaging-variant"


const PackagingOption = model
  .define("packaging_option", {
    id: model.id({ prefix: "pkgopt" }).primaryKey(),
    title: model.text(),
    description: model.text().nullable(),
    image_url: model.text().nullable(),
    is_available: model.boolean().default(true),
    variants: model.hasMany(() => PackagingVariant, { mappedBy: "packaging" }),
  })
  .cascades({ delete: ["variants"] })
  .indexes([{ on: ["is_available"] }])

export default PackagingOption
