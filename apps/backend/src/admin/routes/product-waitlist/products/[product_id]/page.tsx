import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { ChevronDown, ChevronUpMini } from "@medusajs/icons"
import {
  useWaitlistEntries,
  useWaitlistProductDetail,
} from "../../use-product-waitlist"
import { contactLabel, formatDateTime } from "../../components/format"
import PaginationBar from "../../components/pagination-bar"

const LIMIT = 10

const ProductWaitlistProductDetailPage = () => {
  const { product_id } = useParams()
  const navigate = useNavigate()
  const [showPeople, setShowPeople] = useState(false)
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError } = useWaitlistProductDetail(product_id)
  const { data: peopleData } = useWaitlistEntries({
    product_id,
    limit: LIMIT,
    offset,
  })

  if (isLoading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">
          Завантаження…
        </Text>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-error">
          Не вдалося завантажити товар.
        </Text>
      </Container>
    )
  }

  const product = data.product

  return (
    <Container className="p-0 divide-x-0">
      <div className="px-6 py-4 border-b border-ui-border-base">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xs text-ui-fg-subtle hover:text-ui-fg-base mb-1"
        >
          ← Усі заявки
        </button>
        <Heading level="h1">
          {product?.title || "Товар видалено"}
        </Heading>
      </div>

      <div className="flex items-center gap-4 px-6 py-6 border-b border-ui-border-base">
        {product?.thumbnail && (
          <img
            src={product.thumbnail}
            alt=""
            className="w-20 h-20 rounded object-cover"
          />
        )}
        <div>
          <Text size="xlarge" weight="plus">
            {data.total_count}
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            активних заявок очікування
          </Text>
        </div>
      </div>

      {data.variants.length > 0 && (
        <div className="px-6 py-4 border-b border-ui-border-base">
          <Text size="small" weight="plus" className="mb-3">
            Розподіл за варіантами
          </Text>
          <div className="flex flex-wrap gap-2">
            {data.variants.map((v) => (
              <Badge key={v.variant_id} size="small">
                {v.variant_title || v.variant_id}: {v.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-ui-fg-base w-full text-left"
        >
          {showPeople ? <ChevronUpMini /> : <ChevronDown />}
          Список заявок ({data.total_count})
        </button>

        {showPeople && (
          <div className="border-t border-ui-border-base">
            {!peopleData?.entries.length && (
              <Text size="small" className="text-ui-fg-muted px-6 py-4">
                Немає заявок.
              </Text>
            )}
            {!!peopleData?.entries.length && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ui-fg-subtle border-b border-ui-border-base">
                    <th className="px-6 py-2 font-medium">Контакт</th>
                    <th className="px-6 py-2 font-medium">Варіант</th>
                    <th className="px-6 py-2 font-medium">Подано</th>
                    <th className="px-6 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {peopleData.entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-ui-border-base hover:bg-ui-bg-subtle-hover cursor-pointer"
                      onClick={() => navigate(`/product-waitlist/${entry.id}`)}
                    >
                      <td className="px-6 py-3">{contactLabel(entry)}</td>
                      <td className="px-6 py-3 text-ui-fg-subtle">
                        {entry.variant_title || "—"}
                      </td>
                      <td className="px-6 py-3 text-ui-fg-subtle">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="px-6 py-3 text-right text-ui-fg-interactive">
                        Детальніше →
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {peopleData && (
              <PaginationBar
                offset={offset}
                limit={LIMIT}
                count={peopleData.count}
                onChange={setOffset}
              />
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

export default ProductWaitlistProductDetailPage