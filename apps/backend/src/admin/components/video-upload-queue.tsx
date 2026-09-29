import {
  CheckCircleSolid,
  Clock,
  Spinner,
  XCircleSolid,
  XMarkMini,
} from "@medusajs/icons"
import { IconButton, Text } from "@medusajs/ui"

export type UploadQueueStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "done"
  | "error"

export type UploadQueueItem = {
  key: string
  name: string
  size: number
  status: UploadQueueStatus
  /** 0..1, bytes sent to the backend */
  progress: number
  error?: string
}

type Props = {
  items: UploadQueueItem[]
  onDismiss?: () => void
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} МБ`
}

const STATUS_TEXT: Record<Exclude<UploadQueueStatus, "error">, string> = {
  queued: "У черзі",
  uploading: "Завантаження",
  processing: "Збереження...",
  done: "Додано",
}

function StatusIcon({ status }: { status: UploadQueueStatus }) {
  switch (status) {
    case "done":
      return <CheckCircleSolid className="text-ui-tag-green-icon shrink-0" />
    case "error":
      return <XCircleSolid className="text-ui-tag-red-icon shrink-0" />
    case "queued":
      return <Clock className="text-ui-fg-muted shrink-0" />
    default:
      return <Spinner className="text-ui-fg-interactive shrink-0 animate-spin" />
  }
}

const VideoUploadQueue = ({ items, onDismiss }: Props) => {
  if (!items.length) {
    return null
  }

  const finished = items.filter(
    (item) => item.status === "done" || item.status === "error"
  ).length
  const failed = items.filter((item) => item.status === "error").length
  const isActive = finished < items.length

  const overall =
    items.reduce(
      (sum, item) =>
        sum +
        (item.status === "done" || item.status === "error"
          ? 1
          : item.status === "processing"
            ? 0.95
            : item.status === "uploading"
              ? item.progress * 0.95
              : 0),
      0
    ) / items.length

  return (
    <div className="border-ui-border-base bg-ui-bg-subtle mb-4 rounded-md border">
      <div className="flex items-center justify-between gap-x-3 px-3 pt-3">
        <Text size="small" weight="plus">
          {isActive
            ? `Завантаження відео: ${Math.min(finished + 1, items.length)} з ${items.length}`
            : failed
              ? `Завершено: додано ${items.length - failed} з ${items.length}`
              : `Усі відео додано (${items.length})`}
        </Text>
        {!isActive && onDismiss && (
          <IconButton
            size="small"
            variant="transparent"
            type="button"
            aria-label="Сховати список"
            onClick={onDismiss}
          >
            <XMarkMini />
          </IconButton>
        )}
      </div>

      <div className="px-3 pb-2 pt-2">
        <div className="bg-ui-bg-switch-off h-1 w-full overflow-hidden rounded-full">
          <div
            className={
              failed && !isActive
                ? "bg-ui-tag-orange-icon h-full transition-[width] duration-300"
                : "bg-ui-fg-interactive h-full transition-[width] duration-300"
            }
            style={{ width: `${Math.round(overall * 100)}%` }}
          />
        </div>
      </div>

      <ul className="divide-ui-border-base divide-y border-t border-ui-border-base">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-x-3 px-3 py-2">
            <StatusIcon status={item.status} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-baseline justify-between gap-x-3">
                <Text size="small" className="truncate" title={item.name}>
                  {item.name}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted shrink-0">
                  {formatSize(item.size)}
                </Text>
              </div>
              {item.status === "error" ? (
                <Text size="xsmall" className="text-ui-fg-error">
                  {item.error ?? "Помилка завантаження"}
                </Text>
              ) : (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {STATUS_TEXT[item.status]}
                  {item.status === "uploading" &&
                    ` ${Math.round(item.progress * 100)}%`}
                </Text>
              )}
              {item.status === "uploading" && (
                <div className="bg-ui-bg-switch-off mt-1 h-0.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-ui-fg-interactive h-full transition-[width] duration-200"
                    style={{ width: `${Math.round(item.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default VideoUploadQueue
