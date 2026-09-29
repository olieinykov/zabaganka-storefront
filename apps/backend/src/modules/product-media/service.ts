import { MedusaService } from "@medusajs/framework/utils"
import ProductVideoFile from "./models/product-video-file"

class ProductMediaModuleService extends MedusaService({
  ProductVideoFile,
}) {}

export default ProductMediaModuleService
