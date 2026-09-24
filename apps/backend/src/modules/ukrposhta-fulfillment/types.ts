/**
 * Types for the Ukrposhta ("Укрпошта") integration.
 *
 * !! IMPORTANT — PLACEHOLDER NOTICE !!
 * Unlike Nova Poshta, Ukrposhta does NOT expose a public, self-service
 * directory API. Their developer API (https://dev.ukrposhta.ua) requires
 * a signed agreement with Ukrposhta; you receive a `user token` and a
 * `Bearer` authorization token from your account manager after signing a
 * contract (see "API Documentation" PDFs at dev.ukrposhta.ua/uploads/).
 *
 * Because we don't have real, confirmed endpoint paths/shapes without an
 * actual contract + credentials, `client.ts` in this module is a
 * PLACEHOLDER: it implements the same interface the real client would have
 * (getCities / getWarehouses / calculatePrice), wired to the config options
 * below, but returns either a small static city/warehouse fixture list or
 * throws a clear "not configured" error — see comments in client.ts.
 *
 * Once you sign the Ukrposhta agreement and receive real credentials:
 *  1. Fill in UKRPOSHTA_API_BASE_URL / UKRPOSHTA_BEARER_TOKEN in .env.
 *  2. Replace the fixture logic in client.ts with real `fetch` calls per
 *     the Ukrposhta API docs (Authorization: Bearer <token> header).
 * Nothing else needs to change — the fulfillment provider service and the
 * `/store/delivery/ukrposhta/*` API routes already consume this client.
 */

export type UkrposhtaOptions = {
  /** Base URL of the Ukrposhta API, e.g. https://dev.ukrposhta.ua/... (per your contract). */
  apiBaseUrl?: string
  /** Bearer token issued by Ukrposhta after signing the API agreement. */
  bearerToken?: string
  /** User/counterparty token issued together with the bearer token. */
  userToken?: string
  /** Postal code / city ref of the sender warehouse, used for price calculation. */
  senderCityRef?: string
}

export type UkrposhtaCity = {
  /** Ukrposhta's own city identifier (postal-district based, contract-specific). */
  id: string
  name: string
  region?: string
}

export type UkrposhtaWarehouse = {
  id: string
  name: string
  address: string
  cityId: string
  postIndex: string
}

export type UkrposhtaDeliveryType = "warehouse" | "courier"

export type UkrposhtaFulfillmentOptionData = {
  carrier: "ukrposhta"
  type: UkrposhtaDeliveryType
}

export type UkrposhtaShippingMethodData = {
  carrier: "ukrposhta"
  type: UkrposhtaDeliveryType
  city_ref?: string
  city_name?: string
  warehouse_ref?: string
  warehouse_name?: string
  /** For courier delivery: street, house and apartment. */
  address?: string
  comment?: string
}
