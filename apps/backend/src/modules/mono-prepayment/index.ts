import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MonoPrepaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [MonoPrepaymentProviderService],
})
