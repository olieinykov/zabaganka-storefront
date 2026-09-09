import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BellAlert } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { useSearchParams } from "react-router-dom"
import { useWaitlistEntries } from "./use-product-waitlist"
import ActiveEntriesSection from "./components/active-entries-section"
import ProductsSummarySection from "./components/products-summary-section"
import ArchivedEntriesSection from "./components/archived-entries-section"

type Tab = "active" | "products" | "archived"

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Заявки" },
  { key: "products", label: "Товари" },
  { key: "archived", label: "Архів" },
]

const ProductWaitlistPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get("tab") as Tab) || "active"

  const setTab = (next: Tab) => {
    setSearchParams(
      next === "active" ? {} : { tab: next },
      { replace: true }
    )
  }

  const { data: countData } = useWaitlistEntries({ limit: 1, offset: 0 })

  return (
    <Container className="p-0 divide-x-0">
      <div className="px-6 py-4 border-b border-ui-border-base flex items-center justify-between">
        <div>
          <Heading level="h1">Очікування на відповідь</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Заявки «повідомити, коли з'явиться» від клієнтів.
          </Text>
        </div>
        <div className="text-right">
          <Text size="xlarge" weight="plus" className="text-ui-fg-base">
            {countData?.count ?? "—"}
          </Text>
          <Text size="xsmall" className="text-ui-fg-subtle">
            активних заявок
          </Text>
        </div>
      </div>

      <div className="flex gap-1 px-6 border-b border-ui-border-base">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clx(
              "px-4 py-3 text-sm border-b-2 -mb-px",
              tab === t.key
                ? "border-ui-fg-base text-ui-fg-base font-medium"
                : "border-transparent text-ui-fg-subtle hover:text-ui-fg-base"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "active" && <ActiveEntriesSection />}
      {tab === "products" && <ProductsSummarySection />}
      {tab === "archived" && <ArchivedEntriesSection />}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Notification requests",
  icon: BellAlert,
})

export default ProductWaitlistPage