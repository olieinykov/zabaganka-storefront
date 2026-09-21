import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { NovaPoshtaClient } from "../modules/nova-poshta-fulfillment/client"
import { getNovaPoshtaEnvConfig } from "../modules/nova-poshta-fulfillment/env-config"
import {
  estimatePackage,
  type CartItemForSizing,
} from "../modules/nova-poshta-fulfillment/package-estimate"
import type { NovaPoshtaShippingMethodData } from "../modules/nova-poshta-fulfillment/types"

type CartItemRow = CartItemForSizing & {
  quantity: number
  unit_price?: number | null
}

const inFlightCartIds = new Set<string>()

export default async function syncDeliveryShippingCostHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cartModuleService = container.resolve(Modules.CART)

  const startedAt = Date.now()
  logger.info(
    `[nova-poshta][sync-delivery-shipping-cost] handler START cart=${data.id}`
  )

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "metadata",
      "shipping_methods.data",
      "items.quantity",
      "items.unit_price",
      "items.variant.weight",
      "items.variant.length",
      "items.variant.width",
      "items.variant.height",
    ],
    filters: { id: data.id },
  })

  const cart = carts?.[0]
  if (!cart?.shipping_methods?.length) {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] handler END (no shipping method) after ${
        Date.now() - startedAt
      }ms`
    )
    return
  }

  const methodData = cart.shipping_methods.at(-1)?.data as
    | NovaPoshtaShippingMethodData
    | undefined

  if (methodData?.carrier !== "nova-poshta" || !methodData?.city_ref) {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] handler END (not nova-poshta) after ${
        Date.now() - startedAt
      }ms`
    )
    return
  }

  const { apiKey, senderCityRef, defaultItemWeightKg, defaultItemDimensionCm } =
    getNovaPoshtaEnvConfig()
  if (!senderCityRef || !apiKey) {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] handler END (no api key/sender city configured) after ${
        Date.now() - startedAt
      }ms`
    )
    return
  }

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  const delivery = (metadata.delivery ?? {}) as Record<string, unknown>

  if (delivery.estimated_for_city_ref === methodData.city_ref) {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] handler END (already estimated) after ${
        Date.now() - startedAt
      }ms`
    )
    return
  }

  if (inFlightCartIds.has(cart.id)) {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] handler END (already in flight) after ${
        Date.now() - startedAt
      }ms`
    )
    return
  }
  inFlightCartIds.add(cart.id)

  setImmediate(() => {
    estimateAndPersistShippingCost({
      cart,
      methodData,
      metadata,
      apiKey,
      senderCityRef,
      defaultItemWeightKg,
      defaultItemDimensionCm,
      query,
      cartModuleService,
      logger,
    })
  })

  logger.info(
    `[nova-poshta][sync-delivery-shipping-cost] handler END (estimate scheduled in background) after ${
      Date.now() - startedAt
    }ms`
  )
}

async function estimateAndPersistShippingCost({
  cart,
  methodData,
  metadata,
  apiKey,
  senderCityRef,
  defaultItemWeightKg,
  defaultItemDimensionCm,
  query,
  cartModuleService,
  logger,
}: {
  cart: { id: string; items?: unknown }
  methodData: NovaPoshtaShippingMethodData
  metadata: Record<string, unknown>
  apiKey: string
  senderCityRef: string
  defaultItemWeightKg: number
  defaultItemDimensionCm: number
  query: any
  cartModuleService: any
  logger: any
}) {
  const bgStartedAt = Date.now()
  logger.info(
    `[nova-poshta][sync-delivery-shipping-cost] BACKGROUND estimate START cart=${cart.id}`
  )
  try {
    const client = new NovaPoshtaClient({ apiKey })
    const items = (cart.items || []) as CartItemRow[]

    const pkg = estimatePackage(items, {
      weightKg: defaultItemWeightKg,
      dimensionCm: defaultItemDimensionCm,
    })

    const declaredCost =
      items.reduce(
        (sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0),
        0
      ) || 300

    const price = await client.getDocumentPrice({
      citySender: senderCityRef,
      cityRecipient: methodData.city_ref!,
      weight: pkg.weightKg,
      cost: Math.max(declaredCost, 300),
      serviceType:
        methodData.type === "courier" ? "WarehouseDoors" : "WarehouseWarehouse",
      optionsSeat: [
        {
          weight: pkg.weightKg,
          volumetricLength: pkg.lengthCm,
          volumetricWidth: pkg.widthCm,
          volumetricHeight: pkg.heightCm,
        },
      ],
    })

    if (!price?.Cost) {
      return
    }

    const { data: freshCarts } = await query.graph({
      entity: "cart",
      fields: ["id", "metadata"],
      filters: { id: cart.id },
    })
    const freshMetadata = (freshCarts?.[0]?.metadata ?? metadata) as Record<
      string,
      unknown
    >
    const freshDelivery = (freshMetadata.delivery ?? {}) as Record<
      string,
      unknown
    >

    await cartModuleService.updateCarts(cart.id, {
      metadata: {
        ...freshMetadata,
        delivery: {
          ...freshDelivery,
          estimated_shipping_cost: price.Cost,
          estimated_for_city_ref: methodData.city_ref,
        },
      },
    })
  } catch (error) {
    logger.warn(
      `[nova-poshta] Background shipping-cost estimate failed: ${
        (error as Error).message
      }`
    )
  } finally {
    logger.info(
      `[nova-poshta][sync-delivery-shipping-cost] BACKGROUND estimate END after ${
        Date.now() - bgStartedAt
      }ms cart=${cart.id}`
    )
    inFlightCartIds.delete(cart.id)
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
}