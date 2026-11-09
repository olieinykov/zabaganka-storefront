import { z } from "@medusajs/framework/zod"

export const StoreAddPackagedItem = z.object({
  variant_id: z.string().min(1),
  quantity: z.number().int().min(1).max(100).default(1),
  packaging_variant_id: z.string().min(1),
})

export type StoreAddPackagedItemType = z.infer<typeof StoreAddPackagedItem>

export const StoreChangeLineItemPackaging = z.object({
  packaging_variant_id: z.string().min(1).nullable(),
})

export type StoreChangeLineItemPackagingType = z.infer<
  typeof StoreChangeLineItemPackaging
>
