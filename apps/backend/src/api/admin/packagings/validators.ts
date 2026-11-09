import { z } from "@medusajs/framework/zod"

const price = z
  .number()
  .min(0)
  .max(1_000_000)
  .refine((value) => Math.round(value * 100) === value * 100, {
    message: "Price can have at most 2 decimal places",
  })

/** Centimetres. */
const dimension = z.number().positive().max(1000)

export const AdminCreatePackaging = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).nullish(),
  image_url: z.string().url().nullish(),
  is_available: z.boolean().optional(),
})

export type AdminCreatePackagingType = z.infer<typeof AdminCreatePackaging>

export const AdminUpdatePackaging = AdminCreatePackaging.partial()

export type AdminUpdatePackagingType = z.infer<typeof AdminUpdatePackaging>

export const AdminCreatePackagingVariant = z.object({
  length: dimension,
  width: dimension,
  height: dimension,
  price,
  image_url: z.string().url().nullish(),
  is_available: z.boolean().optional(),
})

export type AdminCreatePackagingVariantType = z.infer<
  typeof AdminCreatePackagingVariant
>

export const AdminUpdatePackagingVariant = AdminCreatePackagingVariant.partial()

export type AdminUpdatePackagingVariantType = z.infer<
  typeof AdminUpdatePackagingVariant
>

export const AdminSetProductPackaging = z.object({
  variant_ids: z.array(z.string().min(1)).max(200),
})

export type AdminSetProductPackagingType = z.infer<
  typeof AdminSetProductPackaging
>

export const AdminUpsertDefaultPackaging = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).nullish(),
  image_url: z.string().url().nullish(),
})

export type AdminUpsertDefaultPackagingType = z.infer<
  typeof AdminUpsertDefaultPackaging
>
