import { MedusaService } from "@medusajs/framework/utils"
import PackagingDefault from "./models/packaging-default"
import PackagingOption from "./models/packaging-option"
import PackagingVariant from "./models/packaging-variant"

class PackagingModuleService extends MedusaService({
  PackagingDefault,
  PackagingOption,
  PackagingVariant,
}) {}

export default PackagingModuleService
