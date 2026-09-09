import { useParams, useNavigate } from "react-router-dom"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import {
  useCloseWaitlistEntry,
  useNotifyWaitlistEntry,
  useWaitlistEntry,
} from "../use-product-waitlist"
import { closedReasonBadge, contactLabel, formatDateTime } from "../components/format"

const ProductWaitlistEntryPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useWaitlistEntry(id)
  const entry = data?.entry
  const storefrontUrl = data?.storefront_url || ""
  const notify = useNotifyWaitlistEntry()
  const close = useCloseWaitlistEntry()

  if (isLoading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">
          Завантаження…
        </Text>
      </Container>
    )
  }

  if (isError || !entry) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-error">
          Заявку не знайдено.
        </Text>
      </Container>
    )
  }

  const handleNotify = () => {
    notify.mutate(entry.id, {
      onSuccess: (res) => {
        if (res.sent) {
          toast.success("Лист успішно надіслано клієнту")
        } else {
          toast.error(res.message || "Не вдалося надіслати лист")
        }
      },
      onError: (err: any) => {
        toast.error(err?.message || "Не вдалося надіслати лист")
      },
    })
  }

  const handleClose = () => {
    close.mutate(entry.id, {
      onSuccess: () => {
        toast.success("Заявку закрито та перенесено в архів")
      },
      onError: (err: any) => {
        toast.error(
          err?.message ||
            "Не вдалося закрити заявку. Спершу надішліть лист про наявність товару."
        )
      },
    })
  }

  const emailNotSentYet = entry.contact_method === "email" && !entry.notified_at
  const canClose = !entry.is_archived && !emailNotSentYet

  return (
    <Container className="p-0 divide-x-0">
      <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs text-ui-fg-subtle hover:text-ui-fg-base mb-1"
          >
            ← Усі заявки
          </button>
          <Heading level="h1">Заявка на очікування</Heading>
        </div>
        <div className="flex items-center gap-2">
          {entry.is_archived && (
            <Badge size="2xsmall" color={closedReasonBadge(entry.closed_reason).color}>
              {closedReasonBadge(entry.closed_reason).label}
            </Badge>
          )}
          <Badge color={entry.is_archived ? "grey" : "green"}>
            {entry.is_archived ? "В архіві" : "Активна"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-6 py-6">
        <div>
          <Text size="xsmall" className="text-ui-fg-subtle mb-1">
            Товар
          </Text>
          <div className="flex items-center gap-3 mb-4">
            {entry.product_thumbnail && (
              <img
                src={entry.product_thumbnail}
                alt=""
                className="w-14 h-14 rounded object-cover"
              />
            )}
            <div>
              <div className="text-ui-fg-base font-medium">{entry.product_title}</div>
              {entry.variant_title && (
                <div className="text-ui-fg-subtle text-sm">{entry.variant_title}</div>
              )}
              {!entry.product_exists && (
                <div className="text-xs text-ui-fg-error mt-1">
                  Товар видалено — показано дані на момент подачі заявки
                </div>
              )}
              {entry.product_exists && !entry.variant_exists && (
                <div className="text-xs text-ui-fg-error mt-1">
                  Цей варіант видалено — показано дані на момент подачі заявки
                </div>
              )}
              {entry.product_exists && entry.variant_exists && (
                <a
                  href={`${storefrontUrl}/products/${entry.product_handle}${
                    entry.variant_id ? `?v_id=${entry.variant_id}` : ""
                  }`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-ui-fg-interactive"
                >
                  Переглянути товар в магазині →
                </a>
              )}
            </div>
          </div>
          {/* PHONE FEATURE */}
          {/*<Field label="Спосіб зв'язку">
            <Badge size="2xsmall">
              {entry.contact_method === "email" ? "Email" : "Телефон"}
            </Badge>
          </Field>*/}
          <Field label="Контакт">{contactLabel(entry)}</Field>
        </div>

        <div>
          <Field label="Дата подання заявки">{formatDateTime(entry.created_at)}</Field>
          <Field label="Лист про наявність надіслано">
            {entry.notified_at ? (
              formatDateTime(entry.notified_at)
            ) : (
              <span className="text-ui-fg-muted">Ще не надіслано</span>
            )}
          </Field>
          {entry.notify_error && (
            <Field label="Остання помилка надсилання">
              <span className="text-ui-fg-error">{entry.notify_error}</span>
            </Field>
          )}
          <Field label="Заявка закрита">
            {entry.is_archived ? formatDateTime(entry.archived_at) : "—"}
          </Field>
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-ui-border-base">
        {entry.contact_method === "email" && !entry.is_archived && (
          <Button
            variant="secondary"
            onClick={handleNotify}
            isLoading={notify.isPending}
          >
            {entry.notified_at ? "Надіслати лист повторно" : "Надіслати лист"}
          </Button>
        )}

        {!entry.is_archived && (
          <Button
            variant="primary"
            onClick={handleClose}
            isLoading={close.isPending}
            disabled={!canClose}
          >
            Закрити заявку
          </Button>
        )}
      </div>

      {emailNotSentYet && !entry.is_archived && (
        <div className="px-6 pb-6">
          <Text size="small" className="text-ui-fg-subtle">
            Закрити заявку можна лише після успішного надсилання листа про
            наявність товару.
          </Text>
        </div>
      )}
    </Container>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <Text size="xsmall" className="text-ui-fg-subtle mb-1">
        {label}
      </Text>
      <Text size="small" className="text-ui-fg-base">
        {children}
      </Text>
    </div>
  )
}

export default ProductWaitlistEntryPage