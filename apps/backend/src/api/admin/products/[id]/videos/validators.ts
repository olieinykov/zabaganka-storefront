import { z } from "@medusajs/framework/zod"
import { ALLOWED_VIDEO_MIME_TYPES } from "../../../../../lib/product-video"

export const AdminCreateProductVideos = z.object({
  videos: z
    .array(
      z.object({
        url: z.string().url(),
        file_id: z.string().min(1),
        mime_type: z.enum(ALLOWED_VIDEO_MIME_TYPES),
      })
    )
    .min(1)
    .max(10),
})

export type AdminCreateProductVideosType = z.infer<
  typeof AdminCreateProductVideos
>

export const AdminReorderProductVideos = z.object({
  positions: z
    .array(
      z.object({
        id: z.string().min(1),
        rank: z.number().int().min(0),
      })
    )
    .min(1),
})

export type AdminReorderProductVideosType = z.infer<
  typeof AdminReorderProductVideos
>
