import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Text } from "@medusajs/ui"
import { useWaitlistEntries, useWaitlistProducts } from "../use-product-waitlist"
import { contactLabel, formatDateTime } from "./format"
import PaginationBar from "./pagination-bar"

const LIMIT = 20

export default function ActiveEntriesSection() {
  const navigate = useNavigate()
  const [productId, setProductId] = useState("")
  const [variantId, setVariantId] = useState("")
  const [contactMethod, setContactMethod] = useState<"" | "email" | "phone">("")
  const [order, setOrder] = useState<"date_desc" | "date_asc">("date_desc")
  const [offset, setOffset] = useState(0)

  const { data: productsData } = useWaitlistProducts({ limit: 200 })

  const { data, isLoading, isError } = useWaitlistEntries({
    product_id: productId || undefined,
    variant_id: variantId || undefined,
    contact_method: contactMethod || undefined,
    order,
    limit: LIMIT,
    offset,
  })

  const selectedProduct = useMemo(
    () => productsData?.products.find((p) => p.product_id === productId),
    [productsData, productId]
  )

  const resetPage = () => setOffset(0)

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-ui-border-base">
        <FilterSelect
          label="Товар"
          value={productId}
          onChange={(v) => {
            setProductId(v)
            setVariantId("")
            resetPage()
          }}
        >
          <option value="">Усі товари</option>
          {productsData?.products.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_title}
            </option>
          ))}
        </FilterSelect>

        {!!selectedProduct?.variants.length && (
          <FilterSelect
            label="Варіант"
            value={variantId}
            onChange={(v) => {
              setVariantId(v)
              resetPage()
            }}
          >
            <option value="">Усі варіанти</option>
            {selectedProduct.variants.map((v) => (
              <option key={v.variant_id} value={v.variant_id}>
                {v.variant_title || v.variant_id}
              </option>
            ))}
          </FilterSelect>
        )}
        {/* PHONE FEATURE */}
        {/*<FilterSelect
          label="Зв'язок"
          value={contactMethod}
          onChange={(v) => {
            setContactMethod(v as any)
            resetPage()
          }}
        >
          <option value="">Усі</option>
          <option value="email">Email</option>
          <option value="phone">Телефон</option>
        </FilterSelect>*/}

        <FilterSelect
          label="Сортування"
          value={order}
          onChange={(v) => {
            setOrder(v as any)
            resetPage()
          }}
        >
          <option value="date_desc">Спочатку нові</option>
          <option value="date_asc">Спочатку старі</option>
        </FilterSelect>
      </div>

      {isLoading && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Завантаження…
        </Text>
      )}
      {isError && (
        <Text size="small" className="text-ui-fg-error px-6 py-6">
          Не вдалося завантажити заявки.
        </Text>
      )}
      {!isLoading && !isError && data?.entries.length === 0 && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Заявок не знайдено.
        </Text>
      )}

      {!!data?.entries.length && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ui-fg-subtle border-b border-ui-border-base">
              <th className="px-6 py-2 font-medium">Товар</th>
              <th className="px-6 py-2 font-medium">Контакт</th>
              {/* PHONE FEATURE */}
              {/*<th className="px-6 py-2 font-medium">Спосіб</th>*/}
              <th className="px-6 py-2 font-medium">Подано</th>
              <th className="px-6 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-ui-border-base hover:bg-ui-bg-subtle-hover cursor-pointer"
                onClick={() => navigate(`/product-waitlist/${entry.id}`)}
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {entry.product_thumbnail && (
                      <img
                        src={entry.product_thumbnail}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <div className="text-ui-fg-base">{entry.product_title}</div>
                      {entry.variant_title && (
                        <div className="text-ui-fg-subtle text-xs">
                          {entry.variant_title}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-ui-fg-base">{contactLabel(entry)}</td>
                {/* PHONE FEATURE */}
                {/*<td className="px-6 py-3">
                  <Badge size="2xsmall">
                    {entry.contact_method === "email" ? "Email" : "Телефон"}
                  </Badge>
                </td>*/}
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

      {data && (
        <PaginationBar
          offset={offset}
          limit={LIMIT}
          count={data.count}
          onChange={setOffset}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ui-fg-subtle">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="txt-compact-small border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-field"
      >
        {children}
      </select>
    </label>
  )
}
