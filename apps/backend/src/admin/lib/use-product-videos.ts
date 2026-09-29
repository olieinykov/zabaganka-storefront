import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BACKEND_URL, sdk } from "./sdk"
import { toSafeFile } from "./safe-file"

export type ProductVideoDTO = {
  id: string
  url: string
  file_id: string
  mime_type: string | null
  rank: number
}

type ProductVideosResponse = { videos: ProductVideoDTO[] }

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const

export type AllowedVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number]

export const MAX_VIDEO_SIZE_MB = 50

const EXTENSION_MIME_TYPES: Record<string, AllowedVideoMimeType> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
}

export function resolveVideoMimeType(file: File): AllowedVideoMimeType | null {
  if ((ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return file.type as AllowedVideoMimeType
  }

  const ext = /\.([a-zA-Z0-9]+)$/.exec(file.name)?.[1]?.toLowerCase()
  return (ext && EXTENSION_MIME_TYPES[ext]) || null
}

const productVideosKey = (productId: string) => [
  "product-videos",
  productId,
]

export function useProductVideos(productId: string | undefined) {
  return useQuery({
    queryKey: productVideosKey(productId ?? ""),
    queryFn: () =>
      sdk.client.fetch<ProductVideosResponse>(
        `/admin/products/${productId}/videos`
      ),
    enabled: !!productId,
  })
}

type UploadedFile = { id: string; url: string }

function uploadFileWithProgress(
  file: File,
  onProgress: (ratio: number) => void
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append("files", file)

    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${BACKEND_URL.replace(/\/$/, "")}/admin/uploads`)
    xhr.withCredentials = true
    xhr.responseType = "json"

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total)
      }
    }
    xhr.onload = () => {
      const body = xhr.response as
        | { files?: UploadedFile[]; message?: string }
        | null
      const uploaded = body?.files?.[0]

      if (xhr.status >= 200 && xhr.status < 300 && uploaded?.url) {
        resolve(uploaded)
      } else {
        reject(
          new Error(
            body?.message ||
              (xhr.status === 413
                ? "Файл завеликий для сервера"
                : "Не вдалося отримати URL завантаженого файлу")
          )
        )
      }
    }
    xhr.onerror = () => reject(new Error("Помилка мережі під час завантаження"))

    xhr.send(form)
  })
}

export type UploadProductVideoInput = {
  file: File
  mimeType: AllowedVideoMimeType
  onProgress?: (ratio: number) => void
  onProcessing?: () => void
}

export function useUploadProductVideo(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      mimeType,
      onProgress,
      onProcessing,
    }: UploadProductVideoInput) => {
      const safeFile = toSafeFile(new File([file], file.name, { type: mimeType }))
      const uploaded = await uploadFileWithProgress(safeFile, (ratio) => {
        onProgress?.(ratio)
        if (ratio >= 1) onProcessing?.()
      })

      try {
        return await sdk.client.fetch<ProductVideosResponse>(
          `/admin/products/${productId}/videos`,
          {
            method: "POST",
            body: {
              videos: [
                { url: uploaded.url, file_id: uploaded.id, mime_type: mimeType },
              ],
            },
          }
        )
      } catch (err) {
        await sdk.admin.upload.delete(uploaded.id).catch(() => undefined)
        throw err
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(productVideosKey(productId), data)
    },
  })
}

export function useDeleteProductVideo(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (videoId: string) =>
      sdk.client.fetch(`/admin/products/${productId}/videos/${videoId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productVideosKey(productId) })
    },
  })
}

export type GalleryImage = {
  id: string
  url: string
  rank?: number | null
}

export type GalleryItem =
  | { type: "image"; id: string; url: string }
  | { type: "video"; id: string; url: string }

export function mergeProductMedia(
  images: GalleryImage[],
  videos: ProductVideoDTO[]
): GalleryItem[] {
  const sortedImages = [...images].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0)
  )
  const sortedVideos = [...videos].sort((a, b) => a.rank - b.rank)
  const result: GalleryItem[] = []
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

  return result
}

export function useReorderProductVideos(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (positions: { id: string; rank: number }[]) =>
      sdk.client.fetch<ProductVideosResponse>(
        `/admin/products/${productId}/videos/reorder`,
        { method: "POST", body: { positions } }
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(productVideosKey(productId), data)
    },
  })
}
