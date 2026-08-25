import { useEffect, useState } from "react"
import { Button, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import ImageUploadField from "./image-upload-field"
import {
  useCategoryGridCategories,
  useSavePageContentBlock,
} from "../use-page-content"

type Row = {
  category_id: string
  name: string
  image_url: string | null
  image_alt: string
}


export default function CategoryGridForm({ page }: { page: string }) {
  const {
    data: categories,
    isLoading,
    isError,
  } = useCategoryGridCategories(page)
  const [rows, setRows] = useState<Row[]>([])
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    if (categories) {
      setRows(categories)
    }
  }, [categories])

  const updateRow = (category_id: string, patch: Partial<Row>) =>
    setRows((rs) =>
      rs.map((r) => (r.category_id === category_id ? { ...r, ...patch } : r))
    )

  const handleSave = () => {
    mutate(
      {
        block_key: "category_grid",
        content: {
          images: rows.map(({ category_id, image_url, image_alt }) => ({
            category_id,
            image_url,
            image_alt,
          })),
        },
      },
      {
        onSuccess: () => toast.success("Блок Category Grid збережено"),
        onError: (err: any) =>
          toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">Category Grid</Heading>
      <Text size="small" className="text-ui-fg-subtle -mt-4">
        Категорії підтягуються з каталогу автоматично — на сайті показуються
        перші 4 категорії верхнього рівня. Тут можна додати або замінити
        фонове зображення для кожної.
      </Text>

      {isLoading && (
        <Text size="small" className="text-ui-fg-muted">
          Завантаження категорій…
        </Text>
      )}
      {isError && (
        <Text size="small" className="text-ui-fg-error">
          Не вдалося завантажити категорії.
        </Text>
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          У каталозі немає категорій верхнього рівня.
        </Text>
      )}

      <div className="flex flex-col gap-y-4">
        {rows.map((row) => (
          <div
            key={row.category_id}
            className="flex items-end gap-x-3 border border-ui-border-base rounded-md p-3"
          >
            <ImageUploadField
              label="Зображення"
              value={row.image_url}
              onChange={(url) =>
                updateRow(row.category_id, { image_url: url })
              }
            />
            <div className="flex flex-col gap-y-2 flex-1">
              <div className="flex gap-2">
              <Label size="small" className="text-ui-fg-muted">
                Категорія:
              </Label>
              <Text size="small" className="text-ui-fg-muted">
                {row.name}
              </Text>
              </div>
              <Label size="small">Alt-текст</Label>
              <Input
                value={row.image_alt}
                onChange={(e) =>
                  updateRow(row.category_id, { image_alt: e.target.value })
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button
          size="small"
          isLoading={isPending}
          disabled={isLoading || rows.length === 0}
          onClick={handleSave}
        >
          Зберегти
        </Button>
      </div>
    </div>
  )
}