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
import { ArrowDownMini, ArrowUpMini, Plus, Trash } from "@medusajs/icons"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"

type Feature = { id: string; text: string }

type WhyUsContent = {
  eyebrow: string
  heading: string
  description: string
  features: Feature[]
}

const newId = () =>
  `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

export default function WhyUsForm({
  block,
  page,
}: {
  block: PageContentBlockDTO
  page: string
}) {
  const [content, setContent] = useState<WhyUsContent>(
    block.content as WhyUsContent
  )
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content as WhyUsContent)
  }, [block.content])

  const set = <K extends keyof WhyUsContent>(key: K, value: WhyUsContent[K]) =>
    setContent((c) => ({ ...c, [key]: value }))

  const updateFeature = (id: string, text: string) =>
    setContent((c) => ({
      ...c,
      features: c.features.map((f) => (f.id === id ? { ...f, text } : f)),
    }))

  const addFeature = () =>
    setContent((c) => ({
      ...c,
      features: [...c.features, { id: newId(), text: "" }],
    }))

  const removeFeature = (id: string) =>
    setContent((c) => ({
      ...c,
      features: c.features.filter((f) => f.id !== id),
    }))

  const moveFeature = (index: number, direction: -1 | 1) =>
    setContent((c) => {
      const next = [...c.features]
      const target = index + direction
      if (target < 0 || target >= next.length) return c
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...c, features: next }
    })

  const handleSave = () => {
    const cleaned = {
      ...content,
      features: content.features.filter((f) => f.text.trim().length > 0),
    }
    mutate(
      { block_key: "why_us", content: cleaned },
      {
        onSuccess: () => toast.success("Блок Why Us збережено"),
        onError: (err: any) => toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Heading level="h2">Why Us</Heading>

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

      <div className="flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <Label size="small">Пункти списку (features)</Label>
          <Button size="small" variant="secondary" onClick={addFeature}>
            <Plus /> Додати пункт
          </Button>
        </div>

        {content.features.length === 0 && (
          <Text size="small" className="text-ui-fg-muted">
            Список порожній — додайте хоча б один пункт.
          </Text>
        )}

        {content.features.map((feature, index) => (
          <div key={feature.id} className="flex items-center gap-x-2">
            <Text
              size="xsmall"
              className="text-ui-fg-muted w-6 shrink-0 text-center"
            >
              {String(index + 1).padStart(2, "0")}
            </Text>
            <Input
              value={feature.text}
              onChange={(e) => updateFeature(feature.id, e.target.value)}
              placeholder="Текст пункту"
            />
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              disabled={index === 0}
              onClick={() => moveFeature(index, -1)}
            >
              <ArrowUpMini />
            </IconButton>
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              disabled={index === content.features.length - 1}
              onClick={() => moveFeature(index, 1)}
            >
              <ArrowDownMini />
            </IconButton>
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              onClick={() => removeFeature(feature.id)}
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
