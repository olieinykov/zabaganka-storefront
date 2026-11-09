import { model } from "@medusajs/framework/utils"
import PackagingOption from "./packaging-option"


const PackagingVariant = model
  .define("packaging_variant", {
    id: model.id({ prefix: "pkgvar" }).primaryKey(),
    length: model.float(),
    width: model.float(),
    height: model.float(),
    price: model.bigNumber(),
    image_url: model.text().nullable(),
    is_available: model.boolean().default(true),
    packaging: model.belongsTo(() => PackagingOption, { mappedBy: "variants" }),
  })
  .indexes([
    { on: ["is_available"] },
    {
      name: "IDX_packaging_variant_unique_size",
      on: ["packaging_id", "length", "width", "height"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default PackagingVariant
