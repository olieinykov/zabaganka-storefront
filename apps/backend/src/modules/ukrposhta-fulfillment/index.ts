import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import UkrposhtaFulfillmentProviderService from "./service"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [UkrposhtaFulfillmentProviderService],
})
