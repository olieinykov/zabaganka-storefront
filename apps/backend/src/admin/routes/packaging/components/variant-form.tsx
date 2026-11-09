import { useEffect, useState } from "react"
import { Button, Drawer, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import ImageUploadField from "../../page-content/components/image-upload-field"
import {
  PackagingVariantDTO,
  useSavePackagingVariant,
} from "../../../lib/use-packaging"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  packagingId: string
  variant: PackagingVariantDTO | null
}

type FormState = {
  length: string
  width: string
  height: string
  price: string
  image_url: string | null
  is_available: boolean
}

function toFormState(variant: PackagingVariantDTO | null): FormState {
  return {
    length: variant ? String(variant.length) : "",
    width: variant ? String(variant.width) : "",
    height: variant ? String(variant.height) : "",
    price: variant ? String(variant.price) : "",
    image_url: variant?.image_url ?? null,
    is_available: variant?.is_available ?? true,
  }
}

function parseNumber(value: string): number | null {
  const parsed = Number(value.replace(",", ".").trim())
  return value.trim() && Number.isFinite(parsed) ? parsed : null
}

const DIMENSION_FIELDS = [
  { key: "length", label: "Довжина, см" },
  { key: "width", label: "Ширина, см" },
  { key: "height", label: "Висота, см" },
] as const

export default function VariantForm({
  open,
  onOpenChange,
  packagingId,
  variant,
}: Props) {
  const save = useSavePackagingVariant(packagingId)
  const [form, setForm] = useState<FormState>(() => toFormState(variant))

  useEffect(() => {
    if (open) {
      setForm(toFormState(variant))
    }
  }, [open, variant])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    const length = parseNumber(form.length)
    const width = parseNumber(form.width)
    const height = parseNumber(form.height)
    const price = parseNumber(form.price)

    if ([length, width, height].some((value) => value === null || value <= 0)) {
      toast.error("Некоректні розміри", {
        description: "Довжина, ширина й висота мають бути більші за 0.",
      })
      return
    }
    if (price === null || price < 0) {
      toast.error("Некоректна ціна", {
        description: "Введіть невід'ємне число, наприклад 150 або 99.50.",
      })
      return
    }

    save.mutate(
      {
        id: variant?.id,
        length: length!,
        width: width!,
        height: height!,
        price: Math.round(price * 100) / 100,
        image_url: form.image_url,
        is_available: form.is_available,
      },
      {
        onSuccess: () => {
          toast.success(variant ? "Варіант оновлено" : "Варіант додано")
          onOpenChange(false)
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
            {variant ? "Редагувати варіант" : "Новий варіант"}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-5 overflow-y-auto">
          <div className="flex flex-col gap-y-1">
            <ImageUploadField
              label="Мініатюра варіанта"
              value={form.image_url}
              onChange={(url) => set("image_url", url)}
            />
            <Text size="xsmall" className="text-ui-fg-subtle">
              Якщо не задати, показується фото самого пакування.
            </Text>
          </div>

          <div className="grid grid-cols-3 gap-x-3">
            {DIMENSION_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-y-2">
                <Label htmlFor={`variant-${key}`} size="small">
                  {label}
                </Label>
                <Input
                  id={`variant-${key}`}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label htmlFor="variant-price" size="small">
              Ціна пакування, UAH
            </Label>
            <Input
              id="variant-price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              placeholder="150"
              onChange={(e) => set("price", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between gap-x-4 rounded-md border border-ui-border-base p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-y-1">
              <Label htmlFor="variant-available" size="small">
                Доступний для замовлення
              </Label>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Недоступний варіант не показується покупцям, навіть якщо його
                призначено товару.
              </Text>
            </div>
            <Switch
              id="variant-available"
              className="shrink-0"
              checked={form.is_available}
              onCheckedChange={(checked) => set("is_available", checked)}
            />
          </div>
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
