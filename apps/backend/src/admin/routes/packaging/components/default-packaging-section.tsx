import { useEffect, useState } from "react"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import ImageUploadField from "../../page-content/components/image-upload-field"
import {
  DefaultPackagingDTO,
  useDefaultPackaging,
  useSaveDefaultPackaging,
} from "../../../lib/use-packaging"

export default function DefaultPackagingSection() {
  const { data, isLoading } = useDefaultPackaging()
  const save = useSaveDefaultPackaging()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<DefaultPackagingDTO>({
    title: "",
    description: null,
    image_url: null,
  })

  const current = data?.default_packaging

  useEffect(() => {
    if (open && current) {
      setForm(current)
    }
  }, [open, current])

  const handleSubmit = () => {
    const title = form.title.trim()
    if (!title) {
      toast.error("Вкажіть назву пакування")
      return
    }

    save.mutate(
      {
        title,
        description: form.description?.trim() || null,
        image_url: form.image_url,
      },
      {
        onSuccess: () => {
          toast.success("Фірмове пакування оновлено")
          setOpen(false)
        },
        onError: (err: any) =>
          toast.error("Не вдалося зберегти", {
            description: err?.message ?? "Спробуйте ще раз.",
          }),
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-start justify-between gap-x-4 px-6 py-4">
        <div className="flex items-start gap-x-4">
          {current?.image_url ? (
            <img
              src={current.image_url}
              alt=""
              className="border-ui-border-base h-16 w-16 shrink-0 rounded-md border object-cover"
            />
          ) : (
            <div className="border-ui-border-base flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed">
              <Text size="xsmall" className="text-ui-fg-muted">
                немає
              </Text>
            </div>
          )}
          <div className="flex flex-col gap-y-1">
            <div className="flex items-center gap-x-2">
              <Heading level="h2">
                {isLoading ? "Фірмове пакування" : current?.title}
              </Heading>
            </div>
            {current?.description && (
              <Text size="small" className="text-ui-fg-subtle">
                {current.description}
              </Text>
            )}
            <Text size="xsmall" className="text-ui-fg-muted">
              Включене до кожного замовлення й обране за замовчуванням у
              картці товару. Тут можна змінити фото, назву та опис.
            </Text>
          </div>
        </div>
        <Button
          size="small"
          variant="secondary"
          className="shrink-0"
          disabled={isLoading}
          onClick={() => setOpen(true)}
        >
          Редагувати
        </Button>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Фірмове пакування</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-5 overflow-y-auto">
            <ImageUploadField
              label="Фото (мініатюра)"
              value={form.image_url}
              onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            />
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="default-packaging-title" size="small">
                Назва
              </Label>
              <Input
                id="default-packaging-title"
                value={form.title}
                maxLength={200}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <Text size="xsmall" className="text-ui-fg-subtle">
                У картці товару показується як «{form.title.trim() || "…"} вже
                включено».
              </Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="default-packaging-description" size="small">
                Короткий опис
              </Label>
              <Textarea
                id="default-packaging-description"
                value={form.description ?? ""}
                maxLength={1000}
                rows={3}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
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
    </Container>
  )
}
