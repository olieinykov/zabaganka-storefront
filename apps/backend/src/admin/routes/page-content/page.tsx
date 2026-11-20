import { ComponentType, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { PageContentBlockDTO, usePageContentBlocks } from "./use-page-content"
import HeroForm from "./components/hero-form"
import CategoryGridForm from "./components/category-grid-form"
import GiftBannerForm from "./components/gift-banner-form"
import WhyUsForm from "./components/why-us-form"
import InstagramSectionForm from "./components/instagram-section-form"
import CtaSectionForm from "./components/cta-section-form"
import ConfigBlockForm, { BlockFormConfig } from "./components/config-block-form"
import {
  ABOUT_BLOCK_CONFIGS,
  CONTACTS_BLOCK_CONFIGS,
} from "./components/page-block-configs"

type BlockFormProps = { block: PageContentBlockDTO; page: string }

type BlockEntry = {
  label: string
  Component: ComponentType<BlockFormProps>
}

type PageEntry = {
  label: string
  heading: string
  blocks: Record<string, BlockEntry>
}

function fromConfigs(
  configs: Record<string, BlockFormConfig>
): Record<string, BlockEntry> {
  return Object.fromEntries(
    Object.entries(configs).map(([key, config]) => [
      key,
      {
        label: config.title,
        Component: (props: BlockFormProps) => (
          <ConfigBlockForm {...props} config={config} />
        ),
      },
    ])
  )
}

const PAGES: Record<string, PageEntry> = {
  home: {
    label: "Головна",
    heading: "Контент головної сторінки",
    blocks: {
      hero: { label: "Hero", Component: HeroForm },
      category_grid: { label: "Category Grid", Component: CategoryGridForm },
      gift_banner: { label: "Gift Banner", Component: GiftBannerForm },
      why_us: { label: "Why Us", Component: WhyUsForm },
      instagram_section: {
        label: "Instagram",
        Component: InstagramSectionForm,
      },
      cta_section: { label: "CTA", Component: CtaSectionForm },
    },
  },
  about: {
    label: "Про нас",
    heading: "Контент сторінки «Про нас»",
    blocks: fromConfigs(ABOUT_BLOCK_CONFIGS),
  },
  contacts: {
    label: "Контакти",
    heading: "Контент сторінки «Контакти»",
    blocks: fromConfigs(CONTACTS_BLOCK_CONFIGS),
  },
}

const firstBlockKey = (page: string) => Object.keys(PAGES[page].blocks)[0]

const PageContentPage = () => {
  const [page, setPage] = useState<string>("home")
  const [active, setActive] = useState<string>(firstBlockKey("home"))
  const { data: blocks, isLoading, isError } = usePageContentBlocks(page)

  const pageEntry = PAGES[page]
  const activeBlock = blocks?.find((b) => b.block_key === active)
  const ActiveForm = pageEntry.blocks[active]?.Component

  const selectPage = (key: string) => {
    setPage(key)
    setActive(firstBlockKey(key))
  }

  return (
    <Container className="p-0 divide-x-0">
      <div className="px-6 py-4 border-b border-ui-border-base flex flex-col gap-y-3">
        <div>
          <Heading level="h1">{pageEntry.heading}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Зміни зберігаються одразу і з'являються на сайті без деплою.
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PAGES).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => selectPage(key)}
              className={clx(
                "rounded-md px-3 py-1.5 txt-compact-small border",
                key === page
                  ? "bg-ui-bg-base border-ui-border-strong text-ui-fg-base font-medium shadow-borders-base"
                  : "border-transparent text-ui-fg-subtle hover:bg-ui-bg-subtle-hover"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] min-h-[480px]">
        <nav className="border-r border-ui-border-base py-3">
          {Object.entries(pageEntry.blocks).map(([key, { label }]) => (
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
            <ActiveForm
              key={`${page}:${active}`}
              block={activeBlock}
              page={page}
            />
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
