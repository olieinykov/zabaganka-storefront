import { MedusaError } from "@medusajs/framework/utils"
import {
  NovaPoshtaOptions,
  NPCitiesResponse,
  NPWarehousesResponse,
  NPDocumentPriceResponse,
} from "./types"

const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/"

/**
 * Thin wrapper around the real, public Nova Poshta API 2.0.
 *
 * This client is intentionally the ONLY place that knows the Nova Poshta
 * API key. It is used both by the fulfillment provider service (server-side,
 * for price calculation and validation) and by the `/store/delivery/nova-poshta/*`
 * API routes (server-side, to power the storefront's city/warehouse autocomplete)
 * so the API key never reaches the browser.
 */
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

  /**
   * Search cities/settlements by a free-text query.
   * Uses Address.getCities (Ref/FindByString/Page/Limit).
   */
  async getCities(query: string, limit = 20) {
    return this.request<NPCitiesResponse["data"][number]>("Address", "getCities", {
      FindByString: query,
      Limit: String(limit),
      Page: "1",
    })
  }

  /**
   * List warehouses (branches/postomats) for a given city ref, optionally
   * filtered by a free-text query and/or warehouse type ref (e.g. postomats).
   * Uses AddressGeneral.getWarehouses.
   */
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

  /**
   * Calculate delivery cost. Uses InternetDocument.getDocumentPrice.
   * ServiceType: "WarehouseWarehouse" | "WarehouseDoors" | "DoorsWarehouse" | "DoorsDoors"
   */
  async getDocumentPrice(params: {
    citySender: string
    cityRecipient: string
    weight: number
    serviceType: "WarehouseWarehouse" | "WarehouseDoors" | "DoorsWarehouse" | "DoorsDoors"
    cost: number
    cargoType?: string
    seatsAmount?: number
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
      }
    )

    return data[0]
  }
}
