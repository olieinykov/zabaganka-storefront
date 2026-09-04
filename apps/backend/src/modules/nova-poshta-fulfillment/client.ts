import { MedusaError } from "@medusajs/framework/utils"
import {
  NovaPoshtaOptions,
  NPCitiesResponse,
  NPWarehousesResponse,
  NPDocumentPriceResponse,
} from "./types"

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/"


export class NovaPoshtaClient {
  private apiKey: string

  constructor(options: NovaPoshtaOptions) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Nova Poshta API key is not configured. Set the NOVA_POSHTA_API_KEY environment variable."
      )
    }
    this.apiKey = options.apiKey
  }

  private async request<T>(
    modelName: string,
    calledMethod: string,
    methodProperties: Record<string, unknown> = {}
  ): Promise<T[]> {
    const response = await fetch(NP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: this.apiKey,
        modelName,
        calledMethod,
        methodProperties,
      }),
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Nova Poshta API request failed with status ${response.status}`
      )
    }

    const json = (await response.json()) as {
      success: boolean
      data: T[]
      errors?: string[]
      warnings?: string[]
    }

    if (!json.success) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Nova Poshta API error: ${(json.errors || []).join(", ") || "unknown error"}`
      )
    }

    return json.data
  }


  async getCities(query: string, limit = 20) {
    return this.request<NPCitiesResponse["data"][number]>("Address", "getCities", {
      FindByString: query,
      Limit: String(limit),
      Page: "1",
    })
  }


  async getWarehouses(params: {
    cityRef: string
    query?: string
    typeOfWarehouseRef?: string
    limit?: number
  }) {
    const { cityRef, query, typeOfWarehouseRef, limit = 50 } = params

    return this.request<NPWarehousesResponse["data"][number]>(
      "AddressGeneral",
      "getWarehouses",
      {
        CityRef: cityRef,
        FindByString: query || undefined,
        TypeOfWarehouseRef: typeOfWarehouseRef || undefined,
        Limit: String(limit),
        Page: "1",
      }
    )
  }


  async getDocumentPrice(params: {
    citySender: string
    cityRecipient: string
    weight: number
    serviceType: "WarehouseWarehouse" | "WarehouseDoors" | "DoorsWarehouse" | "DoorsDoors"
    cost: number
    cargoType?: string
    seatsAmount?: number
    optionsSeat?: Array<{
      weight: number
      volumetricLength: number
      volumetricWidth: number
      volumetricHeight: number
      packRef?: string
    }>
  }) {
    const data = await this.request<NPDocumentPriceResponse["data"][number]>(
      "InternetDocument",
      "getDocumentPrice",
      {
        CitySender: params.citySender,
        CityRecipient: params.cityRecipient,
        Weight: String(params.weight),
        ServiceType: params.serviceType,
        Cost: String(params.cost),
        CargoType: params.cargoType || "Cargo",
        SeatsAmount: String(params.seatsAmount ?? 1),
        ...(params.optionsSeat?.length
          ? {
              OptionsSeat: params.optionsSeat.map((seat) => ({
                weight: seat.weight,
                volumetricLength: seat.volumetricLength,
                volumetricWidth: seat.volumetricWidth,
                volumetricHeight: seat.volumetricHeight,
                ...(seat.packRef ? { packRef: seat.packRef } : {}),
              })),
            }
          : {}),
      }
    )

    return data[0]
  }
}
