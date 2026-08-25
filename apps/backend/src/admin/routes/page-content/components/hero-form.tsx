import { useEffect, useState } from "react"
import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import ImageUploadField from "./image-upload-field"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"

type HeroContent = {
  eyebrow: string
  heading: string
  subheading: string
  primary_button_label: string
  primary_button_href: string
  secondary_button_label: string
  secondary_button_href: string
  image_url: string | null
  image_alt: string
}

export default function HeroForm({
  block,
  page,
}: {
  block: PageContentBlockDTO
  page: string
}) {
  const [content, setContent] = useState<HeroContent>(block.content as HeroContent)
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content as HeroContent)
  }, [block.content])

  const set = <K extends keyof HeroContent>(key: K, value: HeroContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }))

  const handleSave = () => {
    mutate(
      { block_key: "hero", content },
      {
        onSuccess: () => toast.success("Блок Hero збережено"),
        onError: (err: any) => toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">Hero</Heading>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <Label size="small">Наднапис (eyebrow)</Label>
          <Input
            value={content.eyebrow}
            onChange={(e) => set("eyebrow", e.target.value)}
          />
        </div>
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
        <Label size="small">Підзаголовок</Label>
        <Textarea
          value={content.subheading}
          onChange={(e) => set("subheading", e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <Label size="small">Текст основної кнопки</Label>
          <Input
            value={content.primary_button_label}
            onChange={(e) => set("primary_button_label", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label size="small">Посилання основної кнопки</Label>
          <Input
            value={content.primary_button_href}
            onChange={(e) => set("primary_button_href", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label size="small">Текст другої кнопки</Label>
          <Input
            value={content.secondary_button_label}
            onChange={(e) => set("secondary_button_label", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Label size="small">Посилання другої кнопки</Label>
          <Input
            value={content.secondary_button_href}
            onChange={(e) => set("secondary_button_href", e.target.value)}
          />
        </div>
      </div>

      <ImageUploadField
        label="Брендове фото"
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

      <div>
        <Button size="small" isLoading={isPending} onClick={handleSave}>
          Зберегти
        </Button>
      </div>
    </div>
  )
}
