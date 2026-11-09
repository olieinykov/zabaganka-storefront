import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  IconButton,
  Table,
  Text,
  clx,
  toast,
  usePrompt,
} from "@medusajs/ui"
import PackagingForm from "../components/packaging-form"
import VariantForm from "../components/variant-form"
import {
  DIMENSIONS_HINT,
  formatDimensions,
  formatUah,
  PackagingVariantDTO,
  useDeletePackaging,
  useDeletePackagingVariant,
  usePackaging,
  variantImage,
} from "../../../lib/use-packaging"

const PackagingDetailPage = () => {
  const { id = "" } = useParams()
  const [searchParams] = useSearchParams()
  const highlightedId = searchParams.get("variant")
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { data, isLoading, isError } = usePackaging(id)
  const removePackaging = useDeletePackaging()
  const removeVariant = useDeletePackagingVariant(id)

  const [packagingFormOpen, setPackagingFormOpen] = useState(false)
  const [variantFormOpen, setVariantFormOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<PackagingVariantDTO | null>(null)

  const highlightedRef = useRef<HTMLTableRowElement | null>(null)
  const packaging = data?.packaging

  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [highlightedId, packaging?.id])

  if (isLoading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">
          Завантаження…
        </Text>
      </Container>
    )
  }

  if (isError || !packaging) {
    return (
      <Container className="flex flex-col gap-y-2">
        <Text size="small" className="text-ui-fg-error">
          Пакування не знайдено. Можливо, його вже видалили.
        </Text>
        <Link to="/packaging" className="text-ui-fg-interactive txt-compact-small">
          До списку пакування
        </Link>
      </Container>
    )
  }

  const variants = packaging.variants

  const openVariantForm = (variant: PackagingVariantDTO | null) => {
    setEditingVariant(variant)
    setVariantFormOpen(true)
  }

  const handleDeletePackaging = async () => {
    const confirmed = await prompt({
      title: `Видалити «${packaging.title}»?`,
      description:
        "Буде видалено пакування з усіма варіантами, і воно зникне з усіх товарів. У кошиках покупців воно стане недоступним, і перед оплатою їх попросять обрати інше.",
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })
    if (!confirmed) return

    try {
      await removePackaging.mutateAsync(packaging.id)
      toast.success("Пакування видалено")
      navigate("/packaging")
    } catch (err: any) {
      toast.error("Не вдалося видалити", {
        description: err?.message ?? "Спробуйте ще раз.",
      })
    }
  }

  const handleDeleteVariant = async (variant: PackagingVariantDTO) => {
    const confirmed = await prompt({
      title: `Видалити варіант ${formatDimensions(variant)}?`,
      description:
        "Варіант зникне з усіх товарів, яким його призначено. У кошиках покупців він стане недоступним.",
      confirmText: "Видалити",
      cancelText: "Скасувати",
    })
    if (!confirmed) return

    try {
      await removeVariant.mutateAsync(variant.id)
      toast.success("Варіант видалено")
    } catch (err: any) {
      toast.error("Не вдалося видалити", {
        description: err?.message ?? "Спробуйте ще раз.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-start justify-between gap-x-4 px-6 py-4">
          <div className="flex items-start gap-x-4">
            {packaging.image_url ? (
              <img
                src={packaging.image_url}
                alt=""
                className="border-ui-border-base h-20 w-20 shrink-0 rounded-md border object-cover"
              />
            ) : (
              <div className="border-ui-border-base h-20 w-20 shrink-0 rounded-md border border-dashed" />
            )}
            <div className="flex flex-col gap-y-1">
              <Link
                to="/packaging"
                className="text-ui-fg-subtle hover:text-ui-fg-base flex items-center gap-x-1 txt-compact-small"
              >
                <ArrowLeft /> Усе пакування
              </Link>
              <div className="flex items-center gap-x-2">
                <Heading level="h1">{packaging.title}</Heading>
                <Badge size="2xsmall" color={packaging.is_available ? "green" : "grey"}>
                  {packaging.is_available ? "Доступне" : "Недоступне"}
                </Badge>
              </div>
              {packaging.description && (
                <Text size="small" className="text-ui-fg-subtle">
                  {packaging.description}
                </Text>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-x-2">
            <Button size="small" variant="secondary" onClick={() => setPackagingFormOpen(true)}>
              Редагувати
            </Button>
            <Button
              size="small"
              variant="danger"
              isLoading={removePackaging.isPending}
              onClick={handleDeletePackaging}
            >
              Видалити
            </Button>
          </div>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between gap-x-4 px-6 py-4">
          <div className="flex flex-col gap-y-1">
            <Heading level="h2">Варіанти</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Розміри ({DIMENSIONS_HINT}) і ціна кожного варіанта.
            </Text>
          </div>
          <Button size="small" variant="secondary" onClick={() => openVariantForm(null)}>
            Додати варіант
          </Button>
        </div>
        <div className="px-6 py-4">
          {!variants.length ? (
            <Text size="small" className="text-ui-fg-muted">
              Варіантів ще немає. Без варіантів пакування не можна призначити
              товару.
            </Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Фото</Table.HeaderCell>
                  <Table.HeaderCell>Довжина</Table.HeaderCell>
                  <Table.HeaderCell>Ширина</Table.HeaderCell>
                  <Table.HeaderCell>Висота</Table.HeaderCell>
                  <Table.HeaderCell>Ціна</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {variants.map((variant) => {
                  const isHighlighted = variant.id === highlightedId
                  return (
                    <Table.Row
                      key={variant.id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      className={clx(isHighlighted && "bg-ui-bg-highlight")}
                      data-highlighted={isHighlighted || undefined}
                    >
                      <Table.Cell>
                        {variantImage(variant, packaging) ? (
                          <img
                            src={variantImage(variant, packaging)!}
                            alt=""
                            className={clx(
                              "border-ui-border-base h-10 w-10 rounded-md border object-cover",
                              !variant.image_url && "opacity-60"
                            )}
                            title={
                              variant.image_url
                                ? undefined
                                : "Фото пакування (у варіанта немає свого)"
                            }
                          />
                        ) : (
                          <div className="border-ui-border-base h-10 w-10 rounded-md border border-dashed" />
                        )}
                      </Table.Cell>
                      <Table.Cell>{variant.length} см</Table.Cell>
                      <Table.Cell>{variant.width} см</Table.Cell>
                      <Table.Cell>{variant.height} см</Table.Cell>
                      <Table.Cell>+{formatUah(variant.price)}</Table.Cell>
                      <Table.Cell>
                        <Badge size="2xsmall" color={variant.is_available ? "green" : "grey"}>
                          {variant.is_available ? "Доступний" : "Недоступний"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end">
                          <IconButton
                            size="small"
                            variant="transparent"
                            aria-label="Редагувати варіант"
                            onClick={() => openVariantForm(variant)}
                          >
                            <PencilSquare />
                          </IconButton>
                          <IconButton
                            size="small"
                            variant="transparent"
                            aria-label="Видалити варіант"
                            disabled={removeVariant.isPending}
                            onClick={() => handleDeleteVariant(variant)}
                          >
                            <Trash />
                          </IconButton>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>

      <PackagingForm
        open={packagingFormOpen}
        onOpenChange={setPackagingFormOpen}
        packaging={packaging}
      />
      <VariantForm
        open={variantFormOpen}
        onOpenChange={setVariantFormOpen}
        packagingId={packaging.id}
        variant={editingVariant}
      />
    </div>
  )
}

export default PackagingDetailPage
