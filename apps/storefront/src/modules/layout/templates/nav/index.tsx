import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import CartButton from "@modules/layout/components/cart-button"
import FavoritesButton from "@modules/layout/components/favorites-button"
import Logo from "@modules/layout/components/logo"
import MobileMenuTrigger, {
  NavLink,
} from "@modules/layout/components/mobile-menu"
// ACCOUNT FEATURE: used by the commented-out account link below.
// import Heart from "@modules/common/icons/heart"
import Search from "@modules/common/icons/search"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Nav({
  categories: categoriesProp,
}: {
  /**
   * Passed down from `(main)/layout.tsx`, which fetches categories once and
   * shares the result with both Nav and Footer. Falls back to fetching on
   * its own when rendered without the prop (e.g. in isolation/tests).
   */
  categories?: HttpTypes.StoreProductCategory[]
} = {}) {
  const categories =
    categoriesProp ?? (await listCategories().catch(() => []))

  const navLinks: NavLink[] = [
    { name: "Усі товари", href: "/store?sortBy=created_at" },
    ...(categories || [])
      .filter((c) => !c.parent_category_id)
      .map((c) => ({ name: c.name, href: `/categories/${c.handle}` })),
  ]

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <AnnouncementBar>Допоможемо підібрати розмір і модель</AnnouncementBar>
      <header className="bg-ivory border-b border-line">
        <div className="content-container">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 small:h-18 gap-4">
            <div className="flex items-center gap-8">
              <MobileMenuTrigger links={navLinks} />
            </div>

            <Logo className="justify-self-center" />

            <div className="flex items-center justify-end gap-5">
              <button
                type="button"
                aria-label="Пошук"
                className="hidden small:inline-flex interactive interactive-lift text-ink hover:text-navy"
              >
                <Search size={19} />
              </button>
              {/* ACCOUNT FEATURE: link to the customer account, disabled until
                  the account area is brought back. Restore together with the
                  `Heart` import above.
              <LocalizedClientLink
                href="/account"
                aria-label="Обране"
                className="interactive interactive-lift text-ink hover:text-navy"
                data-testid="nav-account-link"
              >
                <Heart size={19} />
              </LocalizedClientLink>
              */}
              <FavoritesButton />
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="text-ink hover:text-navy"
                    href="/cart"
                    data-testid="nav-cart-link"
                  >
                    Кошик (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>

          <nav className="hidden small:flex items-center justify-center gap-7 pb-4">
            {navLinks.map((link) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                className="text-sm text-ink hover:text-navy interactive"
                data-testid="nav-link"
              >
                {link.name}
              </LocalizedClientLink>
            ))}
          </nav>
        </div>
      </header>
    </div>
  )
}