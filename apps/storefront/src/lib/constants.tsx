import { CreditCard } from "@medusajs/icons"
import Bancontact from "@modules/common/icons/bancontact"
import Ideal from "@modules/common/icons/ideal"
import Mono from "@modules/common/icons/mono"
import PayPal from "@modules/common/icons/paypal"
import React from "react"

/**
 * The store only operates within Ukraine, so there's a single, fixed
 * region/country — no need to route by `[countryCode]` or detect the
 * visitor's location. Used anywhere a Medusa API call needs a country code
 * to resolve pricing/region (getRegion, listProducts, addToCart, etc).
 */
export const COUNTRY_CODE = "ua"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_mono_mono: {
    title: "Оплата зараз (Plata by mono)",
    icon: <Mono />,
  },
  "pp_mono-prepayment_mono-prepayment": {
    title: "Наложений платіж (з передоплатою)",
    icon: <Mono />,
  },
  // Own dummy provider (src/modules/cod-payment on the backend) — not
  // Medusa's built-in "system" default, which is meant for local/dev
  // sandboxing only. See that module for why.
  pp_cod_cod: {
    title: "Наложений платіж (без передоплати)",
    icon: <CreditCard />,
  },
  // `pp_system_default` (Medusa's built-in manual/test provider) is
  // intentionally not registered in medusa-config.ts and not mapped here —
  // it must never be offered to real customers. Keep it out of this map so
  // it can't silently show up with a title if it's ever added to a region
  // by mistake.
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}
// "Наложений платіж (без передоплати)" — our own dummy, gateway-free
// provider (src/modules/cod-payment on the backend). Nothing is charged at
// checkout; the customer just places the order and pays on delivery.
export const isCod = (providerId?: string) => {
  return providerId?.startsWith("pp_cod_")
}
// Matches both the full-payment "mono" provider (pp_mono_mono) and the
// "COD with prepayment" variant (pp_mono-prepayment_mono-prepayment) — both
// are redirect-to-mono-page flows and share the same button/return-page
// logic. Use isMonoPrepayment below when the distinction actually matters
// (e.g. showing the "Загалом X / Зараз Y" breakdown).
export const isMono = (providerId?: string) => {
  return providerId?.startsWith("pp_mono")
}
export const isMonoPrepayment = (providerId?: string) => {
  return providerId?.startsWith("pp_mono-prepayment_")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

export const PRODUCT_PREVIEW_FIELDS =
  "id,title,handle,thumbnail,*images,*categories,+variants.id,*variants.calculated_price";