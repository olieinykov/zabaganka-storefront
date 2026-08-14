import { MedusaError } from "@medusajs/framework/utils"
import { UkrposhtaOptions, UkrposhtaCity, UkrposhtaWarehouse } from "./types"

/**
 * !! PLACEHOLDER CLIENT !!
 * See types.ts for the full explanation. Ukrposhta's directory (cities /
 * post-office) API is only available under a signed contract, so this class
 * cannot call a real, confirmed endpoint out of the box.
 *
 * Behaviour:
 *  - If `apiBaseUrl` + `bearerToken` ARE configured (i.e. you've signed the
 *    contract and filled in your .env), every method attempts a real HTTP
 *    call against `apiBaseUrl`, sending `Authorization: Bearer <token>`.
 *    You will very likely need to adjust the exact paths/payload shape to
 *    match the PDF documentation you received from Ukrposhta — the shape
 *    below is a best-effort placeholder, NOT confirmed against a live API.
 *  - If they are NOT configured (the default, out of the box), the client
 *    falls back to a small static fixture list of major Ukrainian cities so
 *    the storefront UI and checkout flow remain fully testable end-to-end
 *    without real credentials.
 */
export class UkrposhtaClient {
  private options: UkrposhtaOptions
  private isConfigured: boolean

  constructor(options: UkrposhtaOptions) {
    this.options = options
    this.isConfigured = !!(options.apiBaseUrl && options.bearerToken)
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    if (!this.isConfigured) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Ukrposhta API is not configured (UKRPOSHTA_API_BASE_URL / UKRPOSHTA_BEARER_TOKEN missing). " +
          "Using placeholder fixture data instead — see src/modules/ukrposhta-fulfillment/client.ts."
      )
    }

    const response = await fetch(`${this.options.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${this.options.bearerToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Ukrposhta API request failed with status ${response.status}`
      )
    }

    return response.json() as Promise<T>
  }

  async getCities(query: string): Promise<UkrposhtaCity[]> {
    if (!this.isConfigured) {
      return FIXTURE_CITIES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    }

    // PLACEHOLDER path — adjust to match your Ukrposhta API contract.
    return this.request<UkrposhtaCity[]>(
      `/catalog/cities?search=${encodeURIComponent(query)}`
    )
  }

  async getWarehouses(cityId: string, query?: string): Promise<UkrposhtaWarehouse[]> {
    if (!this.isConfigured) {
      const warehouses = FIXTURE_WAREHOUSES[cityId] || []
      return query
        ? warehouses.filter((w) => w.name.toLowerCase().includes(query.toLowerCase()))
        : warehouses
    }

    // PLACEHOLDER path — adjust to match your Ukrposhta API contract.
    return this.request<UkrposhtaWarehouse[]>(
      `/catalog/cities/${cityId}/post-offices${
        query ? `?search=${encodeURIComponent(query)}` : ""
      }`
    )
  }

  /**
   * PLACEHOLDER price calculation. Ukrposhta's real tariff-calculation
   * endpoint requires weight, dimensions, city pair and service type per
   * the contract docs (section "6. Calculation of a shipment delivery
   * cost" in the API documentation PDF). Until configured, we return a
   * simple flat estimate so the storefront can still show *a* price.
   */
  async calculatePrice(params: { cityId: string; weight: number }): Promise<number> {
    if (!this.isConfigured) {
      const base = 60
      const perKg = 15
      return Math.round(base + params.weight * perKg)
    }

    // PLACEHOLDER path — adjust to match your Ukrposhta API contract.
    const result = await this.request<{ cost: number }>(`/tariffs/calculate`, {
      method: "POST",
      body: JSON.stringify(params),
    })
    return result.cost
  }
}

const FIXTURE_CITIES: UkrposhtaCity[] = [
  { id: "kyiv", name: "Київ", region: "м. Київ" },
  { id: "lviv", name: "Львів", region: "Львівська область" },
  { id: "odesa", name: "Одеса", region: "Одеська область" },
  { id: "kharkiv", name: "Харків", region: "Харківська область" },
  { id: "dnipro", name: "Дніпро", region: "Дніпропетровська область" },
  { id: "pavlohrad", name: "Павлоград", region: "Дніпропетровська область" },
]

const FIXTURE_WAREHOUSES: Record<string, UkrposhtaWarehouse[]> = {
  kyiv: [
    { id: "01001", name: "Відділення №1", address: "вул. Хрещатик, 22", cityId: "kyiv", postIndex: "01001" },
    { id: "02000", name: "Відділення №2", address: "просп. Перемоги, 10", cityId: "kyiv", postIndex: "02000" },
  ],
  lviv: [
    { id: "79000", name: "Відділення №1", address: "просп. Свободи, 1", cityId: "lviv", postIndex: "79000" },
  ],
  odesa: [
    { id: "65000", name: "Відділення №1", address: "вул. Дерибасівська, 1", cityId: "odesa", postIndex: "65000" },
  ],
  kharkiv: [
    { id: "61000", name: "Відділення №1", address: "пл. Свободи, 1", cityId: "kharkiv", postIndex: "61000" },
  ],
  dnipro: [
    { id: "49000", name: "Відділення №1", address: "просп. Дмитра Яворницького, 1", cityId: "dnipro", postIndex: "49000" },
  ],
  pavlohrad: [
    { id: "51400", name: "Відділення №1", address: "вул. Дніпровська, 1", cityId: "pavlohrad", postIndex: "51400" },
  ],
}
