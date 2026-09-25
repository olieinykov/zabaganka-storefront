import { listCategories } from "@lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/layout/components/logo"

export default async function Footer({
  categories: categoriesProp,
}: {
  /** See Nav — shared fetch from `(main)/layout.tsx`, with a fallback. */
  categories?: HttpTypes.StoreProductCategory[]
} = {}) {
  const categories =
    categoriesProp ?? (await listCategories().catch(() => [])) ?? []
  const topLevelCategories = categories.filter((c) => !c.parent_category_id)

  return (
    <footer className="w-full">
      <div className="bg-navy border-t border-line">
        <div className="content-container py-16 grid grid-cols-1 small:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10">
          <div className="flex flex-col gap-3">
            <Logo variant="light" className="items-start" />
          </div>

          {topLevelCategories.length > 0 && (
            <FooterColumn title="Каталог">
              {topLevelCategories.slice(0, 6).map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                  className="text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 interactive"
                >
                  {c.name}
                </LocalizedClientLink>
              ))}
            </FooterColumn>
          )}

          <FooterColumn title="Інформація">
            <LocalizedClientLink
              href="/about"
              className="text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 interactive"
            >
              Про нас
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/faq"
              className="text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 interactive"
            >
              Часті питання
            </LocalizedClientLink>
          </FooterColumn>

          <FooterColumn title="Ми в мережі">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 interactive"
            >
              Instagram
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 interactive"
            >
              Telegram
            </a>
          </FooterColumn>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-wide text-white font-semibold">
        {title}
      </span>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
