import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function syncDeliveryShippingCostHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cartModuleService = container.resolve(Modules.CART)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata", "shipping_methods.data"],
    filters: { id: data.id },
  })

  const cart = carts?.[0]
  if (!cart?.shipping_methods?.length) {
    return
  }

  const lastMethodData = cart.shipping_methods.at(-1)?.data as
    | { estimated_shipping_cost?: number }
    | undefined
  const estimatedShippingCost = lastMethodData?.estimated_shipping_cost

  if (estimatedShippingCost == null) {
    return
  }

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  const delivery = (metadata.delivery ?? {}) as Record<string, unknown>

  if (delivery.estimated_shipping_cost === estimatedShippingCost) {
    return
  }

  await cartModuleService.updateCarts(cart.id, {
    metadata: {
      ...metadata,
      delivery: {
        ...delivery,
        estimated_shipping_cost: estimatedShippingCost,
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "cart.updated",
}
