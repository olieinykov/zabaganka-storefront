import { useEffect, useState } from "react"
import {
  Button,
  Heading,
  IconButton,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Plus, Trash } from "@medusajs/icons"
import ImageUploadField from "./image-upload-field"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"

type InstagramImage = { id: string; image_url: string | null; alt: string }

type InstagramSectionContent = {
  eyebrow: string
  heading: string
  description: string
  button_label: string
  button_href: string
  images: InstagramImage[]
}

const newId = () =>
  `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export default function InstagramSectionForm({
  block,
  page,
}: {
  block: PageContentBlockDTO
  page: string
}) {
  const [content, setContent] = useState<InstagramSectionContent>(
    block.content as InstagramSectionContent
  )
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content as InstagramSectionContent)
  }, [block.content])

  const set = <K extends keyof InstagramSectionContent>(
    key: K,
    value: InstagramSectionContent[K]
  ) => setContent((c) => ({ ...c, [key]: value }))

  const updateImage = (id: string, patch: Partial<InstagramImage>) =>
    setContent((c) => ({
      ...c,
      images: c.images.map((img) =>
        img.id === id ? { ...img, ...patch } : img
      ),
    }))

  const addImage = () =>
    setContent((c) => ({
      ...c,
      images: [...c.images, { id: newId(), image_url: null, alt: "" }],
    }))

  const removeImage = (id: string) =>
    setContent((c) => ({
      ...c,
      images: c.images.filter((img) => img.id !== id),
    }))

  const handleSave = () => {
    mutate(
      { block_key: "instagram_section", content },
      {
        onSuccess: () => toast.success("Блок Instagram збережено"),
        onError: (err: any) => toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">Instagram</Heading>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Наднапис (eyebrow)</Label>
        <Input
          value={content.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Заголовок</Label>
        <Textarea
          value={content.heading}
          onChange={(e) => set("heading", e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Опис</Label>
        <Textarea
          value={content.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <Label size="small">Текст кнопки</Label>
          <Input
            value={content.button_label}
            onChange={(e) => set("button_label", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label size="small">Посилання кнопки (Instagram)</Label>
          <Input
            value={content.button_href}
            onChange={(e) => set("button_href", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <Label size="small">Плитки з фото</Label>
          <Button size="small" variant="secondary" onClick={addImage}>
            <Plus /> Додати фото
          </Button>
        </div>

        {content.images.length === 0 && (
          <Text size="small" className="text-ui-fg-muted">
            Немає жодного зображення.
          </Text>
        )}

        {content.images.map((img) => (
          <div
            key={img.id}
            className="flex items-end gap-x-3 border border-ui-border-base rounded-md p-3"
          >
            <ImageUploadField
              label="Зображення"
              value={img.image_url}
              onChange={(url) => updateImage(img.id, { image_url: url })}
            />
            <div className="flex flex-col gap-y-2 flex-1">
              <Label size="small">Alt-текст</Label>
              <Input
                value={img.alt}
                onChange={(e) => updateImage(img.id, { alt: e.target.value })}
              />
            </div>
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              onClick={() => removeImage(img.id)}
            >
              <Trash />
            </IconButton>
          </div>
        ))}
      </div>

      <div>
        <Button size="small" isLoading={isPending} onClick={handleSave}>
          Зберегти
        </Button>
      </div>
    </div>
  )
}
