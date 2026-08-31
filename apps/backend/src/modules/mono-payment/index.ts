import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MonoPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [MonoPaymentProviderService],
})
