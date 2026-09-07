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
      const shippingAddress = context?.shipping_address as
        | { address_1?: string; city?: string }
        | undefined

      if (!shippingAddress?.address_1 || !shippingAddress?.city) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "A full shipping address (street and city) is required for Nova Poshta courier delivery."
        )
      }

      // Nova Poshta's own price calculation needs a real `CityRecipient`
      // Ref for the destination city (see `calculatePrice` below) — the
      // free-text `shipping_address.city` above isn't one, it's just
      // whatever the customer typed into the address form. The storefront
      // resolves an actual Ref via the same Nova Poshta city autocomplete
      // used for warehouse/postomat delivery (see
      // `DeliveryDestination`), so it must be present here too.
      const cityRef = data?.city_ref as string
      const cityName = data?.city_name as string

      if (!cityRef) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "city_ref is required for Nova Poshta courier delivery."
        )
      }

      return {
        carrier: "nova-poshta",
        type,
        city_ref: cityRef,
        city_name: cityName,
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
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const type = (optionData as Record<string, unknown>)?.type as NovaPoshtaDeliveryType
    const cityRef = (data as Record<string, unknown>)?.city_ref as string | undefined

    if (!this.options_.senderCityRef || !cityRef) {
      // Not enough information yet (e.g. city not chosen) — fall back to 0 and
      // let the storefront show a loading/"select a city" state instead of an error.
      // This now also applies to courier: Nova Poshta's `InternetDocument.getDocumentPrice`
      // requires a real `CityRecipient` Ref (per their docs, it's a mandatory
      // parameter regardless of ServiceType) — there is no valid price to
      // calculate without it, and silently pricing against our own sender
      // city was the bug that made courier delivery quotes wrong for any
      // destination other than the sender's own city.
      return { calculated_amount: 0, is_calculated_price_tax_inclusive: true }
    }

    const items = (context?.items || []) as CartItemForSizing[]
    console.log(`ITEMS: ${JSON.stringify(items)}`)
    if (!items.length) {
      // Medusa filters the cart's items down to the ones that ship under
      // THIS option's shipping profile before calling calculatePrice (see
      // filterCartItemsByShippingProfile in @medusajs/core-flows). An
      // empty array here with a non-empty cart almost always means the
      // products in the cart aren't assigned to the same Shipping Profile
      // as this Nova Poshta shipping option — check Settings → Shipping
      // Profiles and each product's "Shipping profile" field in Admin.
      // (It is NOT something this provider can fix — by the time
      // calculatePrice runs, the filtering has already happened.)
      this.logger_.warn(
        "[nova-poshta] calculatePrice received an empty items list. If the cart " +
          "actually has items, this option's Shipping Profile likely doesn't match " +
          "the products' Shipping Profile — check Settings → Shipping Profiles in Admin. " +
          "Falling back to default weight/dimensions for pricing."
      )
    }

    const pkg = estimatePackage(items, {
      weightKg: this.options_.defaultItemWeightKg ?? DEFAULT_ITEM_WEIGHT_KG,
      dimensionCm: this.options_.defaultItemDimensionCm ?? DEFAULT_ITEM_DIMENSION_CM,
    })

    const declaredCost =
      (context as { items?: Array<{ quantity: number; unit_price: number }> })?.items?.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      ) || 300

    try {
      const price = await this.client.getDocumentPrice({
        citySender: this.options_.senderCityRef,
        cityRecipient: cityRef,
        // Kept as a same-value fallback for API versions/edge cases that
        // require a top-level Weight even when OptionsSeat is present.
        weight: pkg.weightKg,
        cost: Math.max(declaredCost, 300),
        serviceType: type === "courier" ? "WarehouseDoors" : "WarehouseWarehouse",
        optionsSeat: [
          {
            weight: pkg.weightKg,
            volumetricLength: pkg.lengthCm,
            volumetricWidth: pkg.widthCm,
            volumetricHeight: pkg.heightCm,
          },
        ],
      })

      return {
        calculated_amount: price?.Cost ?? 0,
        is_calculated_price_tax_inclusive: true,
      }
    } catch (error) {
      this.logger_.warn(
        `[nova-poshta] Failed to calculate live price, falling back to 0: ${
          (error as Error).message
        }`
      )
      return { calculated_amount: 0, is_calculated_price_tax_inclusive: true }
    }
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
