import { model } from "@medusajs/framework/utils"


const PackagingDefault = model.define("packaging_default", {
  id: model.id({ prefix: "pkgdef" }).primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  image_url: model.text().nullable(),
})

export default PackagingDefault
