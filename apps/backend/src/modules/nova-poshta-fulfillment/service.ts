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
const DEFAULT_POSTOMAT_MAX_DIMENSIONS_CM = { length: 40, width: 38, height: 40 }
const DEFAULT_POSTOMAT_MAX_WEIGHT_KG = 20


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
    return !!this.options_.senderCityRef
  }


  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    const type = optionData?.type as NovaPoshtaDeliveryType

    if (type === "postomat") {
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

      return {
        carrier: "nova-poshta",
        type,
        comment: (data?.comment as string) || undefined,
      }
    }

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

    if (!this.options_.senderCityRef || (!cityRef && type !== "courier")) {
      return { calculated_amount: 0, is_calculated_price_tax_inclusive: true }
    }

    const items = (context?.items || []) as CartItemForSizing[]
    console.log(`ITEMS: ${JSON.stringify(items)}`)
    if (!items.length) {
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
        cityRecipient: cityRef || this.options_.senderCityRef,
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

  getClient() {
    return this.client
  }
}

export default NovaPoshtaFulfillmentProviderService
