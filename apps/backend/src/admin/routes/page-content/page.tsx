import { ComponentType, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { usePageContentBlocks } from "./use-page-content"
import HeroForm from "./components/hero-form"
import CategoryGridForm from "./components/category-grid-form"
import GiftBannerForm from "./components/gift-banner-form"
import WhyUsForm from "./components/why-us-form"
import InstagramSectionForm from "./components/instagram-section-form"
import CtaSectionForm from "./components/cta-section-form"

const PAGE = "home"


const BLOCK_FORMS: Record<
  string,
  { label: string; Component: ComponentType<{ block: any; page: string }> }
> = {
  hero: { label: "Hero", Component: HeroForm },
  category_grid: { label: "Category Grid", Component: CategoryGridForm },
  gift_banner: { label: "Gift Banner", Component: GiftBannerForm },
  why_us: { label: "Why Us", Component: WhyUsForm },
  instagram_section: { label: "Instagram", Component: InstagramSectionForm },
  cta_section: { label: "CTA", Component: CtaSectionForm },
}

const PageContentPage = () => {
  const { data: blocks, isLoading, isError } = usePageContentBlocks(PAGE)
  const [active, setActive] = useState<string>("hero")

  const activeBlock = blocks?.find((b) => b.block_key === active)
  const ActiveForm = BLOCK_FORMS[active]?.Component

  return (
    <Container className="p-0 divide-x-0">
      <div className="px-6 py-4 border-b border-ui-border-base">
        <Heading level="h1">Контент головної сторінки</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Зміни зберігаються одразу і з'являються на сайті без деплою.
        </Text>
      </div>

      <div className="grid grid-cols-[220px_1fr] min-h-[480px]">
        <nav className="border-r border-ui-border-base py-3">
          {Object.entries(BLOCK_FORMS).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={clx(
                "w-full text-left px-6 py-2.5 text-sm txt-compact-small",
                key === active
                  ? "bg-ui-bg-subtle text-ui-fg-base font-medium"
                  : "text-ui-fg-subtle hover:bg-ui-bg-subtle-hover"
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-6">
          {isLoading && (
            <Text size="small" className="text-ui-fg-muted">
              Завантаження…
            </Text>
          )}
          {isError && (
            <Text size="small" className="text-ui-fg-error">
              Не вдалося завантажити контент сторінки.
            </Text>
          )}
          {ActiveForm && activeBlock && (
            <ActiveForm block={activeBlock} page={PAGE} />
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Page content",
  icon: PencilSquare,
})

export default PageContentPage