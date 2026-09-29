import { HttpTypes } from "@medusajs/types"

export const PRODUCT_VIDEO_FIELDS = "*product_video_files"

export type ProductVideo = {
  id: string
  url: string
  mime_type: string | null
  /** 0-based position of the video in the combined gallery (photos + videos). */
  rank: number
}

export type ProductMediaItem =
  | { type: "image"; id: string; url: string }
  | { type: "video"; id: string; url: string }

type ProductWithVideos = HttpTypes.StoreProduct & {
  product_video_files?: (ProductVideo | null)[] | null
}

export function getProductVideos(
  product: HttpTypes.StoreProduct | null | undefined
): ProductVideo[] {
  const videos = (product as ProductWithVideos | null | undefined)
    ?.product_video_files

  return (videos ?? [])
    .filter((video): video is ProductVideo => !!video?.url)
    .sort((a, b) => a.rank - b.rank)
}

export function withFirstFrameHint(src: string): string {
  return src.includes("#") ? src : `${src}#t=0.001`
}

export function mergeProductMedia(
  images: HttpTypes.StoreProductImage[],
  videos: ProductVideo[],
  visibleImageIds?: Set<string>
): ProductMediaItem[] {
  const sortedImages = images
    .filter((image) => !!image.url)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const sortedVideos = [...videos].sort((a, b) => a.rank - b.rank)
  const result: ProductMediaItem[] = []
  let i = 0
  let v = 0

  while (i < sortedImages.length || v < sortedVideos.length) {
    const video = sortedVideos[v]
    if (video && (video.rank <= result.length || i >= sortedImages.length)) {
      result.push({ type: "video", id: video.id, url: video.url })
      v++
    } else {
      const image = sortedImages[i]
      result.push({ type: "image", id: image.id, url: image.url })
      i++
    }
  }

  return visibleImageIds
    ? result.filter(
        (item) => item.type === "video" || visibleImageIds.has(item.id)
      )
    : result
}
