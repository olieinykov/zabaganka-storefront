import { useEffect, useState } from "react"
import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import ImageUploadField from "./image-upload-field"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"

type GiftBannerContent = {
  image_url: string | null
  image_alt: string
  eyebrow: string
  heading: string
  description: string
  button_label: string
  button_href: string
  note: string
}

export default function GiftBannerForm({
  block,
  page,
}: {
  block: PageContentBlockDTO
  page: string
}) {
  const [content, setContent] = useState<GiftBannerContent>(
    block.content as GiftBannerContent
  )
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content as GiftBannerContent)
  }, [block.content])

  const set = <K extends keyof GiftBannerContent>(
    key: K,
    value: GiftBannerContent[K]
  ) => setContent((c) => ({ ...c, [key]: value }))

  const handleSave = () => {
    mutate(
      { block_key: "gift_banner", content },
      {
        onSuccess: () => toast.success("Блок Gift Banner збережено"),
        onError: (err: any) => toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">Gift Banner</Heading>

      <ImageUploadField
        label="Фото пакування (ліва частина банера)"
        value={content.image_url}
        onChange={(url) => set("image_url", url)}
      />
      <div className="flex flex-col gap-y-2 max-w-sm">
        <Label size="small">Alt-текст зображення</Label>
        <Input
          value={content.image_alt}
          onChange={(e) => set("image_alt", e.target.value)}
        />
      </div>

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
          rows={3}
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
          <Label size="small">Посилання кнопки</Label>
          <Input
            value={content.button_href}
            onChange={(e) => set("button_href", e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <Label size="small">Примітка під кнопкою</Label>
        <Input
          value={content.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </div>

      <div>
        <Button size="small" isLoading={isPending} onClick={handleSave}>
          Зберегти
        </Button>
      </div>
    </div>
  )
}
