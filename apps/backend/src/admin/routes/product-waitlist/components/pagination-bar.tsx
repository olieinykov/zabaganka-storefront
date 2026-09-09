import { Button, Text } from "@medusajs/ui"

type Props = {
  offset: number
  limit: number
  count: number
  onChange: (offset: number) => void
}

export default function PaginationBar({ offset, limit, count, onChange }: Props) {
  if (count <= limit) {
    return null
  }

  const from = count === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, count)

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-ui-border-base">
      <Text size="small" className="text-ui-fg-subtle">
        {from}–{to} з {count}
      </Text>
      <div className="flex gap-2">
        <Button
          size="small"
          variant="secondary"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(0, offset - limit))}
        >
          Назад
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={offset + limit >= count}
          onClick={() => onChange(offset + limit)}
        >
          Далі
        </Button>
      </div>
    </div>
  )
}
