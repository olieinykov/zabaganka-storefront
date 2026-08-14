import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import NovaPoshtaFulfillmentProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [NovaPoshtaFulfillmentProviderService],
})
