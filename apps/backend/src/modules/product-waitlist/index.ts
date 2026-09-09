import { Module } from "@medusajs/framework/utils"
import ProductWaitlistModuleService from "./service"

export const PRODUCT_WAITLIST_MODULE = "product_waitlist"

export default Module(PRODUCT_WAITLIST_MODULE, {
  service: ProductWaitlistModuleService,
})
