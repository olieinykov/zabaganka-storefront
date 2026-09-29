import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { ArrowDownMini, ArrowUpMini, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  IconButton,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useEffect, useRef, useState } from "react"
import VideoUploadQueue, {
  UploadQueueItem,
} from "../components/video-upload-queue"
import {
  ALLOWED_VIDEO_MIME_TYPES,
  GalleryImage,
  MAX_VIDEO_SIZE_MB,
  mergeProductMedia,
  resolveVideoMimeType,
  useDeleteProductVideo,
  useProductVideos,
  useReorderProductVideos,
  useUploadProductVideo,
} from "../lib/use-product-videos"

type ProductData = {
  id: string
  images?: GalleryImage[] | null
}

const ACCEPT = [...ALLOWED_VIDEO_MIME_TYPES, ".mp4", ".m4v", ".webm", ".mov"].join(",")

const QUEUE_AUTO_HIDE_MS = 4000

function validateVideoFile(file: File): string | null {
  if (!resolveVideoMimeType(file)) {
    return "Непідтримуваний формат. Дозволені: MP4, WebM, MOV."
  }
  if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    return `Файл завеликий. Максимум — ${MAX_VIDEO_SIZE_MB} МБ.`
  }
  return null
}

const ProductVideosWidget = ({ data }: { data?: ProductData }) => {
  const productId = data?.id ?? ""
  const inputRef = useRef<HTMLInputElement>(null)
  const hideQueueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prompt = usePrompt()
  const [queue, setQueue] = useState<UploadQueueItem[]>([])

  const { data: videosResp, isLoading } = useProductVideos(productId)
  const upload = useUploadProductVideo(productId)
  const remove = useDeleteProductVideo(productId)
  const reorder = useReorderProductVideos(productId)

  const videos = videosResp?.videos ?? []
  const gallery = mergeProductMedia(data?.images ?? [], videos)
  const pendingCount = queue.filter(
    (item) => item.status !== "done" && item.status !== "error"
  ).length
  const isUploading = pendingCount > 0
  const isBusy = isUploading || remove.isPending || reorder.isPending

  const clearHideQueueTimer = () => {
    if (hideQueueTimerRef.current) {
      clearTimeout(hideQueueTimerRef.current)
      hideQueueTimerRef.current = null
    }
  }

  useEffect(() => clearHideQueueTimer, [])

  useEffect(() => {
    if (!isUploading) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isUploading])

  const updateQueueItem = (key: string, patch: Partial<UploadQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    )
  }

  const handleFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? [])
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    if (!files.length) {
      return
    }

    clearHideQueueTimer()

    const batch = files.map((file, index) => {
      const error = validateVideoFile(file)
      const item: UploadQueueItem = {
        key: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
        status: error ? "error" : "queued",
        progress: 0,
        ...(error ? { error } : {}),
      }
      return { file, item }
    })
    setQueue(batch.map(({ item }) => item))

    let added = 0
    for (const { file, item } of batch) {
      const mimeType = resolveVideoMimeType(file)
      if (item.status === "error" || !mimeType) {
        continue
      }

      updateQueueItem(item.key, { status: "uploading", progress: 0 })
      try {
        await upload.mutateAsync({
          file,
          mimeType,
          onProgress: (progress) => updateQueueItem(item.key, { progress }),
          onProcessing: () =>
            updateQueueItem(item.key, { status: "processing", progress: 1 }),
        })
        updateQueueItem(item.key, { status: "done", progress: 1 })
        added++
      } catch (err: any) {
        updateQueueItem(item.key, {
          status: "error",
          error: err?.message ?? "Помилка завантаження. Спробуйте ще раз.",
        })
      }
    }

    const failed = batch.length - added
    if (!failed) {
      toast.success(
        added === 1 ? "Відео додано" : `Усі відео додано (${added})`
      )
      hideQueueTimerRef.current = setTimeout(
        () => setQueue([]),
        QUEUE_AUTO_HIDE_MS
      )
    } else if (added) {
      toast.warning(`Додано ${added} з ${batch.length} відео`, {
        description: "Причини помилок — у списку завантаження.",
      })
    } else {
      toast.error(
        batch.length === 1
          ? "Не вдалося додати відео"
          : "Не вдалося додати жодного відео",
        { description: "Причини помилок — у списку завантаження." }
      )
    }
  }

  const handleDelete = async (videoId: string) => {
    const confirmed = await prompt({
      title: "Видалити відео?",
      description: "Відео буде прибрано з товару та видалено зі сховища.",
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })
    if (!confirmed) {
      return
    }

    try {
      await remove.mutateAsync(videoId)
      toast.success("Відео видалено")
    } catch (err: any) {
      toast.error("Не вдалося видалити відео", {
        description: err?.message ?? "Спробуйте ще раз.",
      })
    }
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= gallery.length) {
      return
    }

    const next = [...gallery]
    ;[next[index], next[target]] = [next[target], next[index]]

    const positions = next.flatMap((item, rank) =>
      item.type === "video" ? [{ id: item.id, rank }] : []
    )

    try {
      await reorder.mutateAsync(positions)
    } catch (err: any) {
      toast.error("Не вдалося змінити порядок", {
        description: err?.message ?? "Спробуйте ще раз.",
      })
    }
  }

  if (!productId) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-x-4">
          <Heading level="h2">Відео товару</Heading>
          <Button
            size="small"
            variant="secondary"
            type="button"
            className="shrink-0 whitespace-nowrap"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading
              ? `Завантаження ${queue.length - pendingCount + 1} з ${queue.length}`
              : "Завантажити відео"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        <div className="mt-2 flex flex-col gap-y-1">
          <Text size="small" className="text-ui-fg-subtle">
            MP4, WebM або MOV до {MAX_VIDEO_SIZE_MB} МБ. Відео не може бути
            обкладинкою товару.
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Нижче — порядок галереї на сайті: стрілками можна поставити відео
            між фото. Порядок самих фото змінюється в блоці «Media».
          </Text>
        </div>
      </div>

      <div className="px-6 py-4">
        <VideoUploadQueue
          items={queue}
          onDismiss={() => {
            clearHideQueueTimer()
            setQueue([])
          }}
        />

        {isLoading ? (
          <Text size="small" className="text-ui-fg-muted">
            Завантаження...
          </Text>
        ) : !videos.length ? (
          <Text size="small" className="text-ui-fg-muted">
            Відео ще не додано.
          </Text>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {gallery.map((item, index) => (
              <div
                key={item.id}
                className={
                  item.type === "video"
                    ? "border-ui-border-interactive flex flex-col overflow-hidden rounded-md border"
                    : "border-ui-border-base flex flex-col overflow-hidden rounded-md border opacity-70"
                }
              >
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    playsInline
                    className="bg-ui-bg-subtle aspect-[29/34] w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="bg-ui-bg-subtle aspect-[29/34] w-full object-cover"
                  />
                )}
                <div className="flex min-h-10 items-center justify-between gap-x-1 p-2">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    #{index + 1} {item.type === "video" ? "Відео" : "Фото"}
                  </Text>
                  {item.type === "video" && (
                    <div className="flex items-center">
                      <IconButton
                        size="small"
                        variant="transparent"
                        type="button"
                        aria-label="Перемістити вліво"
                        disabled={isBusy || index === 0}
                        onClick={() => handleMove(index, -1)}
                      >
                        <ArrowUpMini className="-rotate-90" />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        type="button"
                        aria-label="Перемістити вправо"
                        disabled={isBusy || index === gallery.length - 1}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ArrowDownMini className="-rotate-90" />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        type="button"
                        aria-label="Видалити відео"
                        disabled={isBusy}
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductVideosWidget
