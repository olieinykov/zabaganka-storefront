import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import type {
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  FulfillmentOption,
  Logger,
} from "@medusajs/framework/types"
import { UkrposhtaClient } from "./client"
import { UkrposhtaOptions, UkrposhtaDeliveryType } from "./types"
import { resolveCourierAddress } from "../../lib/courier-address"

type InjectedDependencies = {
  logger: Logger
}

/**
 * Fulfillment provider for Ukrposhta ("Укрпошта").
 * See client.ts / types.ts for the placeholder notice regarding the
 * (contract-gated) Ukrposhta directory & tariff API.
 */
class UkrposhtaFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "ukrposhta"

  protected logger_: Logger
  protected options_: UkrposhtaOptions
  protected client: UkrposhtaClient

  constructor({ logger }: InjectedDependencies, options: UkrposhtaOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client = new UkrposhtaClient(options)
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "ukrposhta-warehouse",
        name: "Укрпошта — Відділення",
        carrier: "ukrposhta",
        type: "warehouse" as UkrposhtaDeliveryType,
      },
      {
        id: "ukrposhta-courier",
        name: "Укрпошта — Кур'єр",
        carrier: "ukrposhta",
        type: "courier" as UkrposhtaDeliveryType,
      },
    ]
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    const type = data?.type as UkrposhtaDeliveryType | undefined
    return ["warehouse", "courier"].includes(type as string)
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  private async computeShippingCost(
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<number> {
    const cityRef = data?.city_ref as string | undefined
    const items = (context?.items || []) as Array<{
      quantity: number
      variant?: { weight?: number | null }
    }>
    const weight =
      items.reduce((sum, item) => sum + (item.variant?.weight || 0.5) * item.quantity, 0) || 1

    return this.client.calculatePrice({
      cityId: cityRef || this.options_.senderCityRef || "kyiv",
      weight,
    })
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    const type = optionData?.type as UkrposhtaDeliveryType

    const attachEstimatedCost = async (result: Record<string, unknown>) => {
      try {
        const estimatedShippingCost = await this.computeShippingCost(data, context)
        if (estimatedShippingCost > 0) {
          return { ...result, estimated_shipping_cost: estimatedShippingCost }
        }
      } catch (error) {
        this.logger_.warn(
          `[ukrposhta] Failed to estimate shipping cost during validation: ${
            (error as Error).message
          }`
        )
      }

      return result
    }

    if (type === "courier") {
      const address = resolveCourierAddress(data, context)
      if (!address) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Вкажіть адресу для доставки кур'єром (вулиця, будинок, квартира)."
        )
      }

      const cityRef = data?.city_ref as string | undefined
      const cityName = data?.city_name as string | undefined
      if (!cityRef && !cityName) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Оберіть місто для доставки кур'єром."
        )
      }

      return attachEstimatedCost({
        carrier: "ukrposhta",
        type,
        city_ref: cityRef,
        city_name: cityName,
        address,
        comment: (data?.comment as string) || undefined,
      })
    }

    const cityRef = data?.city_ref as string
    const cityName = data?.city_name as string
    const warehouseRef = data?.warehouse_ref as string
    const warehouseName = data?.warehouse_name as string

    if (!cityRef || !warehouseRef) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Both city_ref and warehouse_ref are required for Ukrposhta warehouse delivery."
      )
    }

    return attachEstimatedCost({
      carrier: "ukrposhta",
      type,
      city_ref: cityRef,
      city_name: cityName,
      warehouse_ref: warehouseRef,
      warehouse_name: warehouseName,
    })
  }

  async calculatePrice(
    _optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    try {
      await this.computeShippingCost(
        data as Record<string, unknown>,
        context as Record<string, unknown>
      )
    } catch (error) {
      this.logger_.warn(
        `[ukrposhta] Failed to calculate price, falling back to 0: ${(error as Error).message}`
      )
    }

    return { calculated_amount: 0, is_calculated_price_tax_inclusive: true }
  }

  /**
   * Real waybill creation requires Ukrposhta contract-specific sender data
   * and is out of scope of the checkout flow — see the same note on the
   * Nova Poshta provider. Returns the data as-is.
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
}

export default UkrposhtaFulfillmentProviderService
