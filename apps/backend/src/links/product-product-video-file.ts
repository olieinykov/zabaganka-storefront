import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import ProductMediaModule from "../modules/product-media"

export default defineLink(ProductModule.linkable.product, {
  linkable: ProductMediaModule.linkable.productVideoFile,
  isList: true,
  deleteCascade: true,
})
