export const DEFAULT_ITEM_WEIGHT_KG = 0.05
export const DEFAULT_ITEM_DIMENSION_CM = 20

type NovaPoshtaEnvConfig = {
  apiKey?: string
  senderCityRef?: string
  defaultItemWeightKg: number
  defaultItemDimensionCm: number
}

export function getNovaPoshtaEnvConfig(): NovaPoshtaEnvConfig {
  return {
    apiKey: process.env.NOVA_POSHTA_API_KEY,
    senderCityRef: process.env.NOVA_POSHTA_SENDER_CITY_REF,
    defaultItemWeightKg: process.env.NOVA_POSHTA_DEFAULT_ITEM_WEIGHT_KG
      ? Number(process.env.NOVA_POSHTA_DEFAULT_ITEM_WEIGHT_KG)
      : DEFAULT_ITEM_WEIGHT_KG,
    defaultItemDimensionCm: process.env.NOVA_POSHTA_DEFAULT_ITEM_DIMENSION_CM
      ? Number(process.env.NOVA_POSHTA_DEFAULT_ITEM_DIMENSION_CM)
      : DEFAULT_ITEM_DIMENSION_CM,
  }
}