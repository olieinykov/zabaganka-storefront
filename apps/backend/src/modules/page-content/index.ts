import { Module } from "@medusajs/framework/utils"
import PageContentModuleService from "./service"

export const PAGE_CONTENT_MODULE = "page_content"

export default Module(PAGE_CONTENT_MODULE, {
  service: PageContentModuleService,
})
