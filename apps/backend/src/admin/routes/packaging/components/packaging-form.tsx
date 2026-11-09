import { useEffect, useState } from "react"
import {
  Button,
  Drawer,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import ImageUploadField from "../../page-content/components/image-upload-field"
import { PackagingDTO, useSavePackaging } from "../../../lib/use-packaging"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  packaging: PackagingDTO | null
  onSaved?: (packaging: PackagingDTO) => void
}

type FormState = {
  title: string
  description: string
  image_url: string | null
  is_available: boolean
}

function toFormState(packaging: PackagingDTO | null): FormState {
  return {
    title: packaging?.title ?? "",
    description: packaging?.description ?? "",
    image_url: packaging?.image_url ?? null,
    is_available: packaging?.is_available ?? true,
  }
}

export default function PackagingForm({
  open,
  onOpenChange,
  packaging,
  onSaved,
}: Props) {
  const save = useSavePackaging()
  const [form, setForm] = useState<FormState>(() => toFormState(packaging))

  useEffect(() => {
    if (open) {
      setForm(toFormState(packaging))
    }
  }, [open, packaging])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    const title = form.title.trim()

    if (!title) {
      toast.error("Вкажіть назву пакування")
      return
    }

    save.mutate(
      {
        id: packaging?.id,
        title,
        description: form.description.trim() || null,
        image_url: form.image_url,
        is_available: form.is_available,
      },
      {
        onSuccess: ({ packaging: saved }) => {
          toast.success(packaging ? "Пакування оновлено" : "Пакування створено")
          onOpenChange(false)
          onSaved?.(saved)
        },
        onError: (err: any) => {
          toast.error("Не вдалося зберегти", {
            description: err?.message ?? "Спробуйте ще раз.",
          })
        },
      }
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>
            {packaging ? "Редагувати пакування" : "Нове пакування"}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-5 overflow-y-auto">
          <ImageUploadField
            label="Фото"
            value={form.image_url}
            onChange={(url) => set("image_url", url)}
          />

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="packaging-title" size="small">
              Назва
            </Label>
            <Input
              id="packaging-title"
              value={form.title}
              maxLength={200}
              placeholder="Оксамитова коробка"
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="packaging-description" size="small">
              Короткий опис
            </Label>
            <Textarea
              id="packaging-description"
              value={form.description}
              maxLength={1000}
              rows={3}
              placeholder="Оксамит, атласна стрічка та листівка"
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-x-4 rounded-md border border-ui-border-base p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-y-1">
              <Label htmlFor="packaging-available" size="small">
                Доступне для замовлення
              </Label>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Вимкнене пакування не показується покупцям — усі його варіанти
                приховуються, навіть якщо їх призначено товарам.
              </Text>
            </div>
            <Switch
              id="packaging-available"
              className="shrink-0"
              checked={form.is_available}
              onCheckedChange={(checked) => set("is_available", checked)}
            />
          </div>

          {!packaging && (
            <Text size="xsmall" className="text-ui-fg-subtle">
              Розміри та ціни задаються у варіантах — їх можна додати одразу
              після збереження.
            </Text>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" size="small" type="button">
              Скасувати
            </Button>
          </Drawer.Close>
          <Button
            size="small"
            type="button"
            isLoading={save.isPending}
            onClick={handleSubmit}
          >
            Зберегти
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
