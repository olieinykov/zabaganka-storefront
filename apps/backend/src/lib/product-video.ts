export const PRODUCT_VIDEOS_CHANGED_EVENT = "product-video.changed"

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const

const VIDEO_EXTENSION_RE =
  /\.(mp4|m4v|mov|webm|ogv|avi|mkv|wmv|flv|3gp|mpe?g)$/i

export function isVideoUrl(url: unknown): boolean {
  if (typeof url !== "string" || !url) {
    return false
  }

  let pathname = url
  try {
    pathname = new URL(url).pathname
  } catch {
    pathname = url.split(/[?#]/)[0]
  }

  return VIDEO_EXTENSION_RE.test(pathname)
}
