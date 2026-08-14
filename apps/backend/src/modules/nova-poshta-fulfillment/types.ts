/**
 * Types for the Nova Poshta ("Нова Пошта") integration.
 *
 * Reference: Nova Poshta API 2.0 (public, real, documented API)
 * https://developers.novaposhta.ua/
 *
 * The API is a single JSON-RPC-like endpoint: POST https://api.novaposhta.ua/v2.0/json/
 * with a body of { apiKey, modelName, calledMethod, methodProperties }.
 */

export type NovaPoshtaOptions = {
  /** Nova Poshta API key (from the counterparty's cabinet, https://new.novaposhta.ua). */
  apiKey: string
  /**
   * City ref (Ref of the "sender" city / warehouse location) used to calculate
   * delivery cost from. Usually the Ref of the city where your main warehouse/stock
   * location is. Optional — if omitted, price calculation is skipped and only the
   * flat/fallback price configured on the shipping option is used.
   */
  senderCityRef?: string
}

export type NovaPoshtaCity = {
  Ref: string
  Description: string
  DescriptionRu?: string
  AreaDescription?: string
  SettlementTypeDescription?: string
}

export type NovaPoshtaWarehouse = {
  Ref: string
  Description: string
  DescriptionRu?: string
  ShortAddress?: string
  Number: string
  CityRef: string
  CityDescription: string
  TypeOfWarehouse: string
  CategoryOfWarehouse?: string
  Schedule?: Record<string, string>
}

/**
 * The Nova Poshta warehouse "TypeOfWarehouse" ref for postomats (parcel lockers).
 * This is a stable, well-known reference id published by Nova Poshta.
 */
export const NP_POSTOMAT_TYPE_REF = "f9316480-5f2d-425d-bc2c-ac7cd29decf0"

export type NovaPoshtaDeliveryType = "warehouse" | "postomat" | "courier"

export type NovaPoshtaFulfillmentOptionData = {
  carrier: "nova-poshta"
  type: NovaPoshtaDeliveryType
}

/** Data stored on a cart/order shipping method once the customer completes checkout step. */
export type NovaPoshtaShippingMethodData = {
  carrier: "nova-poshta"
  type: NovaPoshtaDeliveryType
  city_ref?: string
  city_name?: string
  warehouse_ref?: string
  warehouse_name?: string
  /** For courier delivery, additional comment (e.g. entrance/floor). */
  comment?: string
}

type NPResponse<T> = {
  success: boolean
  data: T[]
  errors: string[]
  warnings: string[]
  info: unknown
}

export type NPCitiesResponse = NPResponse<NovaPoshtaCity>
export type NPWarehousesResponse = NPResponse<NovaPoshtaWarehouse>
export type NPDocumentPriceResponse = NPResponse<{ Cost: number; CostRedelivery?: number }>
