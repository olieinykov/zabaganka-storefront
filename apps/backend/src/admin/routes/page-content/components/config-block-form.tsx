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
import ImageUploadField from "./image-upload-field"
import { useSavePageContentBlock } from "../use-page-content"
import type { PageContentBlockDTO } from "../use-page-content"


export type ScalarFieldConfig = {
  key: string
  label: string
  type: "text" | "email" | "textarea" | "image"
  rows?: number
  placeholder?: string
  hint?: string
}

export type ListFieldConfig = {
  key: string
  label: string
  type: "list"
  itemLabel: string
  addLabel: string
  fields: ScalarFieldConfig[]
  /** Values for a freshly added item (the id is generated automatically). */
  newItem: () => Record<string, unknown>
  hint?: string
}

export type FieldConfig = ScalarFieldConfig | ListFieldConfig

export type BlockFormConfig = {
  title: string
  description?: string
  fields: FieldConfig[]
}

type ListItem = Record<string, unknown> & { id: string }
type Content = Record<string, unknown>

const newId = () =>
  `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

function isEmptyItem(item: ListItem, fields: ScalarFieldConfig[]) {
  return fields.every((field) => {
    const value = item[field.key]
    return value === null || value === undefined || String(value).trim() === ""
  })
}

function ScalarField({
  field,
  value,
  onChange,
}: {
  field: ScalarFieldConfig
  value: unknown
  onChange: (value: unknown) => void
}) {
  if (field.type === "image") {
    return (
      <ImageUploadField
        label={field.label}
        value={(value as string | null) ?? null}
        onChange={onChange}
      />
    )
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small">{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
        />
      ) : (
        <Input
          type={field.type === "email" ? "email" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.hint && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {field.hint}
        </Text>
      )}
    </div>
  )
}

function ListField({
  field,
  items,
  onChange,
}: {
  field: ListFieldConfig
  items: ListItem[]
  onChange: (items: ListItem[]) => void
}) {
  const updateItem = (id: string, key: string, value: unknown) =>
    onChange(
      items.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <Label size="small">{field.label}</Label>
        <Button
          size="small"
          variant="secondary"
          type="button"
          onClick={() =>
            onChange([...items, { ...field.newItem(), id: newId() }])
          }
        >
          <Plus /> {field.addLabel}
        </Button>
      </div>

      {field.hint && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {field.hint}
        </Text>
      )}

      {items.length === 0 && (
        <Text size="small" className="text-ui-fg-muted">
          Список порожній.
        </Text>
      )}

      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-y-4 rounded-lg border border-ui-border-base p-4"
        >
          <div className="flex items-center justify-between">
            <Text size="small" weight="plus">
              {field.itemLabel} {index + 1}
            </Text>
            <div className="flex items-center gap-x-1">
              <IconButton
                type="button"
                size="small"
                variant="transparent"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUpMini />
              </IconButton>
              <IconButton
                type="button"
                size="small"
                variant="transparent"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownMini />
              </IconButton>
              <IconButton
                type="button"
                size="small"
                variant="transparent"
                onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              >
                <Trash />
              </IconButton>
            </div>
          </div>
          {field.fields.map((sub) => (
            <ScalarField
              key={sub.key}
              field={sub}
              value={item[sub.key]}
              onChange={(value) => updateItem(item.id, sub.key, value)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function ConfigBlockForm({
  block,
  page,
  config,
}: {
  block: PageContentBlockDTO
  page: string
  config: BlockFormConfig
}) {
  const [content, setContent] = useState<Content>(block.content)
  const { mutate, isPending } = useSavePageContentBlock(page)

  useEffect(() => {
    setContent(block.content)
  }, [block.content])

  const set = (key: string, value: unknown) =>
    setContent((c) => ({ ...c, [key]: value }))

  const handleSave = () => {
    // Drop list items the editor added but left completely blank, so they
    // don't trip "required" validation on the server.
    const cleaned: Content = { ...content }
    for (const field of config.fields) {
      if (field.type === "list") {
        const items = (cleaned[field.key] as ListItem[] | undefined) ?? []
        cleaned[field.key] = items.filter(
          (item) => !isEmptyItem(item, field.fields)
        )
      }
    }

    mutate(
      { block_key: block.block_key, content: cleaned },
      {
        onSuccess: () => toast.success(`Блок «${config.title}» збережено`),
        onError: (err: any) =>
          toast.error(err?.message || "Помилка збереження"),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">{config.title}</Heading>
        {config.description && (
          <Text size="small" className="text-ui-fg-subtle">
            {config.description}
          </Text>
        )}
      </div>

      {config.fields.map((field) =>
        field.type === "list" ? (
          <ListField
            key={field.key}
            field={field}
            items={(content[field.key] as ListItem[] | undefined) ?? []}
            onChange={(items) => set(field.key, items)}
          />
        ) : (
          <ScalarField
            key={field.key}
            field={field}
            value={content[field.key]}
            onChange={(value) => set(field.key, value)}
          />
        )
      )}

      <div>
        <Button size="small" isLoading={isPending} onClick={handleSave}>
          Зберегти
        </Button>
      </div>
    </div>
  )
}
