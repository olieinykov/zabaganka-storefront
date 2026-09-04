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
  /**
   * Fallback weight (kg) used per unit when a variant has no `weight` set.
   * Missing weight is a data-quality problem (fix it on the product in
   * Admin), this is only a safety net so pricing doesn't outright fail.
   */
  defaultItemWeightKg?: number
  /**
   * Fallback per-axis dimension (cm) used when a variant has no
   * length/width/height set. Same rationale as defaultItemWeightKg.
   */
  defaultItemDimensionCm?: number
  /**
   * Maximum overall parcel dimensions (cm, L×W×H after our box-fitting
   * calculation — see calculatePrice) and weight (kg) that fit in a Nova
   * Poshta postomat cell. This varies by postomat generation/cell size in
   * practice, so it's intentionally configurable rather than hardcoded —
   * set it to the smallest guarantee you're comfortable with, or to the
   * largest cell size your target postomats support if you're fine with
   * some orders needing a bigger locker.
   * Defaults to Nova Poshta's standard largest publicly listed postomat
   * cell (~40×38×40 cm, 20 kg) if not set.
   */
  postomatMaxDimensionsCm?: { length: number; width: number; height: number }
  postomatMaxWeightKg?: number
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
