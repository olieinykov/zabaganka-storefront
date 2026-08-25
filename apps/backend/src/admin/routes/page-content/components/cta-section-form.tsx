import { useEffect, useState } from "react"
import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"

type CtaSectionContent = {
  eyebrow: string
  heading: string
  button_label: string
  button_href: string
}

export default function CtaSectionForm({
  block,
  page,
}: {
  block: PageContentBlockDTO
  page: string
}) {
  const [content, setContent] = useState<CtaSectionContent>(
    block.content as CtaSectionContent
  )
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content as CtaSectionContent)
  }, [block.content])

  const set = <K extends keyof CtaSectionContent>(
    key: K,
    value: CtaSectionContent[K]
  ) => setContent((c) => ({ ...c, [key]: value }))

  const handleSave = () => {
    mutate(
      { block_key: "cta_section", content },
      {
        onSuccess: () => toast.success("Блок CTA збережено"),
        onError: (err: any) => toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">CTA Section</Heading>

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

      <div>
        <Button size="small" isLoading={isPending} onClick={handleSave}>
          Зберегти
        </Button>
      </div>
    </div>
  )
}
