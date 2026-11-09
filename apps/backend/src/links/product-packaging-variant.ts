import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import PackagingModule from "../modules/packaging"

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  {
    linkable: PackagingModule.linkable.packagingVariant,
    isList: true,
  }
)
