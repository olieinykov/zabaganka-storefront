import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import type {
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  FulfillmentOption,
  Logger,
} from "@medusajs/framework/types"
import { NovaPoshtaClient } from "./client"
import {
  NovaPoshtaOptions,
  NovaPoshtaDeliveryType,
} from "./types"
import { estimatePackage, type CartItemForSizing } from "./package-estimate"
import { resolveCourierAddress } from "../../lib/courier-address"

type InjectedDependencies = {
  logger: Logger
}

const DEFAULT_ITEM_WEIGHT_KG = 0.05
const DEFAULT_ITEM_DIMENSION_CM = 20
// Nova Poshta's largest publicly listed standard postomat cell as of this
// writing. Configurable via options — see types.ts for why.
const DEFAULT_POSTOMAT_MAX_DIMENSIONS_CM = { length: 40, width: 38, height: 40 }
const DEFAULT_POSTOMAT_MAX_WEIGHT_KG = 20

/**
 * Fulfillment provider for Nova Poshta ("Нова Пошта").
 *
 * Exposes three fulfillment options that admins can turn into shipping
 * options in the dashboard:
 *  - nova-poshta-warehouse : delivery to a branch ("відділення")
 *  - nova-poshta-postomat  : delivery to a parcel locker ("поштомат")
 *  - nova-poshta-courier   : courier delivery to the door
 *
 * City/warehouse lookups for the storefront autocomplete are served by the
 * `/store/delivery/nova-poshta/*` API routes, which reuse the same
 * `NovaPoshtaClient` so the API key never leaves the server.
 */
class NovaPoshtaFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "nova-poshta"

  protected logger_: Logger
  protected options_: NovaPoshtaOptions
  protected client: NovaPoshtaClient

  constructor({ logger }: InjectedDependencies, options: NovaPoshtaOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client = new NovaPoshtaClient(options)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "nova-poshta-warehouse",
        name: "Нова Пошта — Відділення",
        carrier: "nova-poshta",
        type: "warehouse" as NovaPoshtaDeliveryType,
      },
      {
        id: "nova-poshta-postomat",
        name: "Нова Пошта — Поштомат",
        carrier: "nova-poshta",
        type: "postomat" as NovaPoshtaDeliveryType,
      },
      {
        id: "nova-poshta-courier",
        name: "Нова Пошта — Кур'єр",
        carrier: "nova-poshta",
        type: "courier" as NovaPoshtaDeliveryType,
      },
    ]
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    const type = data?.type as NovaPoshtaDeliveryType | undefined
    return ["warehouse", "postomat", "courier"].includes(type as string)
  }

  async canCalculate(): Promise<boolean> {
    // We can always attempt a live calculation as long as a sender city is configured.
    return !!this.options_.senderCityRef
  }

  /**
   * Validates (and enriches) the data submitted when the customer selects this
   * shipping option / adds the shipping method to the cart. This is where the
   * city/warehouse chosen via the storefront autocomplete gets validated and
   * normalized before it's stored on the cart's shipping method `data` field
   * (from which it is later copied into `metadata` — see the storefront
   * `setDeliveryDestination` action and the `order-delivery-metadata` subscriber).
   */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    const type = optionData?.type as NovaPoshtaDeliveryType
    const __startedAt = Date.now()
    this.logger_.info(
      `[nova-poshta][service] validateFulfillmentData START type=${type}`
    )

    if (type === "postomat") {
      // Authoritative capacity gate — the storefront should already grey
      // out "Поштомат" when the order doesn't fit (see the
      // /store/delivery/nova-poshta/postomat-limits route and the
      // checkout delivery-step UI), but that's just UX; this is what
      // actually stops an oversized order from being placed with a
      // postomat that can't physically hold it, in case JS is bypassed or
      // the client-side check is stale.
      const items = (context?.items || []) as CartItemForSizing[]
      const pkg = estimatePackage(items, {
        weightKg: this.options_.defaultItemWeightKg ?? DEFAULT_ITEM_WEIGHT_KG,
        dimensionCm: this.options_.defaultItemDimensionCm ?? DEFAULT_ITEM_DIMENSION_CM,
      })
      const maxDims = this.options_.postomatMaxDimensionsCm ?? DEFAULT_POSTOMAT_MAX_DIMENSIONS_CM
      const maxWeight = this.options_.postomatMaxWeightKg ?? DEFAULT_POSTOMAT_MAX_WEIGHT_KG

      const exceedsWeight = pkg.weightKg > maxWeight
      const exceedsDimensions =
        pkg.lengthCm > maxDims.length ||
        pkg.widthCm > maxDims.width ||
        pkg.heightCm > maxDims.height

      if (exceedsWeight || exceedsDimensions) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Замовлення не поміщається у поштомат (орієнтовно ${+pkg.weightKg.toFixed(1) / 1000} кг, ${pkg.lengthCm.toFixed(0)}×${pkg.widthCm.toFixed(0)}×${pkg.heightCm.toFixed(
            0
          )} см; ліміт поштомата: ${maxWeight} кг, ${maxDims.length}×${maxDims.width}×${
            maxDims.height
          } см). Оберіть доставку у відділення.`
        )
      }
    }

    if (type === "courier") {
      const address = resolveCourierAddress(data, context)
      if (!address) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Вкажіть адресу для доставки кур'єром (вулиця, будинок, квартира)."
        )
      }

      const cityRef = data?.city_ref as string
      const cityName = data?.city_name as string

      if (!cityRef) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Оберіть місто для доставки кур'єром."
        )
      }

      this.logger_.info(
        `[nova-poshta][service] validateFulfillmentData END (courier) after ${
          Date.now() - __startedAt
        }ms`
      )
      return {
        carrier: "nova-poshta",
        type,
        city_ref: cityRef,
        city_name: cityName,
        address,
        comment: (data?.comment as string) || undefined,
      }
    }

    // warehouse / postomat — city + warehouse selection is mandatory
    const cityRef = data?.city_ref as string
    const cityName = data?.city_name as string
    const warehouseRef = data?.warehouse_ref as string
    const warehouseName = data?.warehouse_name as string

    if (!cityRef || !warehouseRef) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Both city_ref and warehouse_ref are required for Nova Poshta ${type} delivery.`
      )
    }

    this.logger_.info(
      `[nova-poshta][service] validateFulfillmentData END (${type}) after ${
        Date.now() - __startedAt
      }ms`
    )
    return {
      carrier: "nova-poshta",
      type,
      city_ref: cityRef,
      city_name: cityName,
      warehouse_ref: warehouseRef,
      warehouse_name: warehouseName,
    }
  }

  async calculatePrice(
    _optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    _context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    this.logger_.info(`[nova-poshta][service] calculatePrice CALLED (returns 0 immediately)`)
    return { calculated_amount: 0, is_calculated_price_tax_inclusive: true }
  }

  /**
   * Called when an admin creates a fulfillment for an order using this provider.
   * A full "create TTN / waybill" integration (InternetDocument.save) would go
   * here — it requires sender counterparty data (contract-specific) which is
   * outside the scope of the storefront checkout flow, so this returns the
   * data as-is. Extend this method once sender counterparty details are
   * configured to actually generate and store a real Nova Poshta waybill number.
   */
  async createFulfillment(
    data: Record<string, unknown>,
    _items: unknown[],
    _order: unknown,
    fulfillment: Record<string, unknown>
  ): Promise<any> {
    return {
      data: {
        ...(fulfillment?.data as object),
        ...data,
      },
      labels: [],
    }
  }

  async cancelFulfillment(_data: Record<string, unknown>): Promise<any> {
    return {}
  }

  /** Exposes the underlying API client so the store API routes could resolve
   *  this service and reuse the client. Currently the store routes instantiate
   *  their own client from env vars directly for simplicity (see api/store/delivery). */
  getClient() {
    return this.client
  }
}

export default NovaPoshtaFulfillmentProviderService