import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Input, Text } from "@medusajs/ui"
import { useArchivedWaitlistEntries } from "../use-product-waitlist"
import { closedReasonBadge, contactLabel, formatDateTime } from "./format"
import PaginationBar from "./pagination-bar"

const LIMIT = 20

export default function ArchivedEntriesSection() {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const [contactMethod, setContactMethod] = useState<"" | "email" | "phone">("")
  const [closedBy, setClosedBy] = useState<"all" | "manual" | "auto">("all")
  const [order, setOrder] = useState<"date_desc" | "date_asc">("date_desc")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError } = useArchivedWaitlistEntries({
    q: q || undefined,
    contact_method: contactMethod || undefined,
    closed_by: closedBy,
    order,
    limit: LIMIT,
    offset,
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-ui-border-base">
        <Input
          placeholder="Пошук за email…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOffset(0)
          }}
          className="max-w-xs"
        />
        {/* PHONE FEATURE */}
        {/*<label className="flex items-center gap-2 text-xs text-ui-fg-subtle">
          Зв'язок
          <select
            value={contactMethod}
            onChange={(e) => {
              setContactMethod(e.target.value as any)
              setOffset(0)
            }}
            className="txt-compact-small border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-field"
          >
            <option value="">Усі</option>
            <option value="email">Email</option>
            <option value="phone">Телефон</option>
          </select>
        </label>*/}

        <label className="flex items-center gap-2 text-xs text-ui-fg-subtle">
          Закрито
          <select
            value={closedBy}
            onChange={(e) => {
              setClosedBy(e.target.value as any)
              setOffset(0)
            }}
            className="txt-compact-small border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-field"
          >
            <option value="all">Усі</option>
            <option value="manual">Вручну менеджером</option>
            <option value="auto">Автоматично (товар/варіант видалено)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ui-fg-subtle">
          Сортування
          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value as any)
              setOffset(0)
            }}
            className="txt-compact-small border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-field"
          >
            <option value="date_desc">Спочатку нові</option>
            <option value="date_asc">Спочатку старі</option>
          </select>
        </label>
      </div>

      {isLoading && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Завантаження…
        </Text>
      )}
      {isError && (
        <Text size="small" className="text-ui-fg-error px-6 py-6">
          Не вдалося завантажити архів.
        </Text>
      )}
      {!isLoading && !isError && data?.entries.length === 0 && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Архів порожній.
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
              <th className="px-6 py-2 font-medium">Лист надіслано</th>
              <th className="px-6 py-2 font-medium">Закрито</th>
              <th className="px-6 py-2 font-medium">Причина закриття</th>
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
                  {formatDateTime(entry.notified_at)}
                </td>
                <td className="px-6 py-3 text-ui-fg-subtle">
                  {formatDateTime(entry.archived_at)}
                </td>
                <td className="px-6 py-3">
                  {(() => {
                    const badge = closedReasonBadge(entry.closed_reason)
                    return <Badge size="2xsmall" color={badge.color}>{badge.label}</Badge>
                  })()}
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