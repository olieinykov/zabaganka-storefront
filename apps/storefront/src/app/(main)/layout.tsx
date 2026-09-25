import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { listCategories } from "@lib/data/categories"
import { getFavoriteIds } from "@lib/data/cookies"
// ACCOUNT FEATURE: customer retrieval, disabled while there is no account area.
// import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import { FavoritesProvider } from "@modules/favorites/context"
// ACCOUNT FEATURE: banner for transferring a guest cart to a logged-in customer.
// import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // ACCOUNT FEATURE: restore `retrieveCustomer()` here and add `customer` back
  // to the destructuring when the account area is re-enabled.
  const [cart, categories, favoriteIds] = await Promise.all([
    retrieveCart(),
    listCategories().catch(() => []),
    getFavoriteIds(),
  ])

  const shippingOptions = cart
    ? (await listCartOptions()).shipping_options
    : ([] as StoreCartShippingOption[])

  return (
    <FavoritesProvider initialIds={favoriteIds}>
      <Nav categories={categories} />
      {/* ACCOUNT FEATURE: cart transfer banner for logged-in customers.
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}
      */}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer categories={categories} />
    </FavoritesProvider>
  )
}
