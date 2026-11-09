import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Gift } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import DefaultPackagingSection from "./components/default-packaging-section"
import PackagingForm from "./components/packaging-form"
import { formatPriceRange, usePackagings } from "../../lib/use-packaging"

function variantsLabel(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} варіант`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} варіанти`
  }
  return `${count} варіантів`
}

const PackagingListPage = () => {
  const navigate = useNavigate()
  const { data, isLoading, isError } = usePackagings()
  const [formOpen, setFormOpen] = useState(false)

  const packagings = data?.packagings ?? []

  return (
    <div className="flex flex-col gap-y-3">
      <DefaultPackagingSection />
      <Container className="divide-y p-0">
        <div className="flex items-start justify-between gap-x-4 px-6 py-4">
          <div className="flex flex-col gap-y-1">
            <Heading level="h1">Додаткове пакування</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Платне пакування, яке покупець може обрати в картці прикраси. У
              кожного пакування є варіанти з розмірами та ціною. Безкоштовне
              фірмове пакування налаштовується в блоці вище.
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Які варіанти пропонувати конкретному товару, обирається на
              сторінці товару в блоці «Пакування».
            </Text>
          </div>
          <Button
            size="small"
            variant="secondary"
            className="shrink-0"
            onClick={() => setFormOpen(true)}
          >
            Додати пакування
          </Button>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <Text size="small" className="text-ui-fg-muted">
              Завантаження…
            </Text>
          ) : isError ? (
            <Text size="small" className="text-ui-fg-error">
              Не вдалося завантажити пакування.
            </Text>
          ) : !packagings.length ? (
            <Text size="small" className="text-ui-fg-muted">
              Ще немає жодного пакування.
            </Text>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Фото</Table.HeaderCell>
                  <Table.HeaderCell>Назва та опис</Table.HeaderCell>
                  <Table.HeaderCell>Варіанти</Table.HeaderCell>
                  <Table.HeaderCell>Ціна</Table.HeaderCell>
                  <Table.HeaderCell>Статус</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {packagings.map((packaging) => (
                  <Table.Row
                    key={packaging.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/packaging/${packaging.id}`)}
                  >
                    <Table.Cell>
                      {packaging.image_url ? (
                        <img
                          src={packaging.image_url}
                          alt=""
                          className="border-ui-border-base h-10 w-10 rounded-md border object-cover"
                        />
                      ) : (
                        <div className="border-ui-border-base h-10 w-10 rounded-md border border-dashed" />
                      )}
                    </Table.Cell>
                    <Table.Cell className="max-w-[360px]">
                      <Text size="small" weight="plus" className="truncate">
                        {packaging.title}
                      </Text>
                      {packaging.description && (
                        <Text
                          size="xsmall"
                          className="text-ui-fg-subtle truncate"
                        >
                          {packaging.description}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {packaging.variants.length
                        ? variantsLabel(packaging.variants.length)
                        : "Немає варіантів"}
                    </Table.Cell>
                    <Table.Cell>
                      {formatPriceRange(packaging.variants)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        size="2xsmall"
                        color={packaging.is_available ? "green" : "grey"}
                      >
                        {packaging.is_available ? "Доступне" : "Недоступне"}
                      </Badge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </div>

        <PackagingForm
          open={formOpen}
          onOpenChange={setFormOpen}
          packaging={null}
          onSaved={(packaging) => navigate(`/packaging/${packaging.id}`)}
        />
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Packaging",
  icon: Gift,
})

export default PackagingListPage
