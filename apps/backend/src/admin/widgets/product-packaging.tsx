import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { CheckMini, XMarkMini } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Text,
  clx,
  toast,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  formatDimensions,
  formatUah,
  PackagingDTO,
  PackagingVariantDTO,
  packagingVariantPath,
  usePackagings,
  variantImage,
  useProductPackaging,
  useSaveProductPackaging,
} from "../lib/use-packaging"

type ProductData = { id: string }

type VariantWithPackaging = PackagingVariantDTO & { packaging: PackagingDTO }

function PackagingImage({ url, className }: { url: string | null; className?: string }) {
  return url ? (
    <img src={url} alt="" className={clx("object-cover", className)} />
  ) : (
    <div className={clx("bg-ui-bg-component", className)} />
  )
}

function VariantThumb({
  variant,
  selected,
}: {
  variant: VariantWithPackaging
  selected?: boolean
}) {
  const unavailable = !variant.is_available || !variant.packaging.is_available
  return (
    <div
      className={clx(
        "flex h-full flex-col overflow-hidden rounded-md border text-left",
        selected
          ? "border-ui-border-interactive shadow-borders-interactive-with-active"
          : "border-ui-border-base"
      )}
    >
      <div className="relative">
        <PackagingImage
          url={variantImage(variant, variant.packaging)}
          className={clx("aspect-square w-full", unavailable && "opacity-50")}
        />
        {selected && (
          <span className="bg-ui-button-inverted text-ui-fg-on-inverted absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full">
            <CheckMini />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-y-0.5 p-2">
        <Text size="xsmall" weight="plus" className="truncate">
          {variant.packaging.title}
        </Text>
        <Text size="xsmall" className="text-ui-fg-subtle">
          {formatDimensions(variant)}
        </Text>
        <Text size="xsmall">+{formatUah(variant.price)}</Text>
        {unavailable && (
          <Badge size="2xsmall" color="grey" className="mt-1 w-fit">
            Недоступний
          </Badge>
        )}
      </div>
    </div>
  )
}

const ProductPackagingWidget = ({ data }: { data?: ProductData }) => {
  const productId = data?.id ?? ""
  const { data: packagingsResp, isLoading: packagingsLoading } = usePackagings()
  const { data: settingsResp, isLoading: settingsLoading } =
    useProductPackaging(productId)
  const save = useSaveProductPackaging(productId)

  const [modalOpen, setModalOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])

  const packagings = packagingsResp?.packagings ?? []
  const settings = settingsResp?.packaging

  const variantsById = useMemo(() => {
    const map = new Map<string, VariantWithPackaging>()
    for (const packaging of packagings) {
      for (const variant of packaging.variants) {
        map.set(variant.id, { ...variant, packaging })
      }
    }
    return map
  }, [packagings])

  const selected = (settings?.variant_ids ?? [])
    .map((id) => variantsById.get(id))
    .filter((variant): variant is VariantWithPackaging => !!variant)

  useEffect(() => {
    if (modalOpen) {
      setDraft(settings?.variant_ids ?? [])
    }
  }, [modalOpen, settings])

  const persist = (
    body: { variant_ids: string[] },
    successMessage: string,
    onDone?: () => void
  ) => {
    save.mutate(body, {
      onSuccess: () => {
        toast.success(successMessage)
        onDone?.()
      },
      onError: (err: any) =>
        toast.error("Не вдалося зберегти", {
          description: err?.message ?? "Спробуйте ще раз.",
        }),
    })
  }

  if (!productId) {
    return null
  }

  const variantIds = settings?.variant_ids ?? []
  const offeredCount = selected.filter(
    (variant) => variant.is_available && variant.packaging.is_available
  ).length

  const toggleDraft = (id: string) =>
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Пакування</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Фірмове пакування Zabaganka включене завжди. Тут — платні варіанти,
          які покупець може обрати в картці товару.
        </Text>
      </div>

      {packagingsLoading || settingsLoading ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Завантаження…
          </Text>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-y-3 px-6 py-4">
            {selected.length ? (
              <div className="grid grid-cols-2 gap-2">
                {selected.map((variant) => (
                  <div key={variant.id} className="group relative">
                    <Link
                      to={packagingVariantPath(variant)}
                      title="Відкрити пакування"
                      className="block h-full"
                    >
                      <VariantThumb variant={variant} />
                    </Link>
                    <button
                      type="button"
                      aria-label="Прибрати з товару"
                      disabled={save.isPending}
                      onClick={() =>
                        persist(
                          { variant_ids: variantIds.filter((id) => id !== variant.id) },
                          "Варіант прибрано з товару"
                        )
                      }
                      className="bg-ui-bg-base text-ui-fg-subtle hover:text-ui-fg-base shadow-elevation-card-rest absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    >
                      <XMarkMini />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <Text size="small" className="text-ui-fg-muted">
                Пакування для цього товару ще не обрано — на сайті буде лише
                фірмове, без кнопки «Додати пакування».
              </Text>
            )}

            {selected.length > 0 && offeredCount === 0 && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                Усі обрані варіанти зараз недоступні — на сайті буде лише
                фірмове, без кнопки «Додати пакування».
              </Text>
            )}

            <div className="flex items-center justify-between gap-x-2">
              <Link to="/packaging">
                <Text size="xsmall" className="text-ui-fg-interactive">
                  Усе пакування
                </Text>
              </Link>
              <Button size="small" variant="secondary" onClick={() => setModalOpen(true)}>
                Обрати пакування
              </Button>
            </div>
          </div>
        </>
      )}

      <FocusModal open={modalOpen} onOpenChange={setModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex w-full items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  Скасувати
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                isLoading={save.isPending}
                onClick={() =>
                  persist(
                    { variant_ids: draft },
                    "Пакування товару збережено",
                    () => setModalOpen(false)
                  )
                }
              >
                Зберегти ({draft.length})
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="overflow-y-auto">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-y-8 px-6 py-8">
              <div className="flex flex-col gap-y-1">
                <Heading level="h1">Пакування для товару</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Натисніть на варіанти, які підходять цій прикрасі. Покупець
                  побачить лише доступні з них.
                </Text>
              </div>

              {!packagings.length && (
                <Text size="small" className="text-ui-fg-muted">
                  Пакування ще не створено.{" "}
                  <Link to="/packaging" className="text-ui-fg-interactive">
                    Створити
                  </Link>
                </Text>
              )}

              {packagings.map((packaging) => (
                <div key={packaging.id} className="flex flex-col gap-y-3">
                  <div className="flex items-baseline gap-x-2">
                    <Heading level="h3">{packaging.title}</Heading>
                    {!packaging.is_available && (
                      <Badge size="2xsmall" color="grey">
                        Недоступне
                      </Badge>
                    )}
                  </div>
                  {!packaging.variants.length ? (
                    <Text size="small" className="text-ui-fg-muted">
                      У цього пакування ще немає варіантів.
                    </Text>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                      {packaging.variants.map((variant) => {
                        const isSelected = draft.includes(variant.id)
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleDraft(variant.id)}
                            className="rounded-md focus-visible:shadow-borders-focus outline-none"
                          >
                            <VariantThumb
                              variant={{ ...variant, packaging }}
                              selected={isSelected}
                            />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductPackagingWidget
