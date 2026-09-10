import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { deleteLineItemsWorkflow } from "@medusajs/core-flows"

export type RemoveStaleCartLineItemsStepInput = {
  product_ids?: string[]
  variant_ids?: string[]
}

export const removeStaleCartLineItemsStep = createStep(
  "remove-stale-cart-line-items",
  async (input: RemoveStaleCartLineItemsStepInput, { container }) => {
    const productIds = (input.product_ids ?? []).filter(Boolean)
    const variantIds = (input.variant_ids ?? []).filter(Boolean)

    if (!productIds.length && !variantIds.length) {
      return new StepResponse({ affected_cart_ids: [] as string[] })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "completed_at",
        "items.id",
        "items.product_id",
        "items.variant_id",
      ],
      filters: {
        completed_at: null,
        items: {
          ...(productIds.length ? { product_id: productIds } : {}),
          ...(variantIds.length ? { variant_id: variantIds } : {}),
        },
      } as any,
      pagination: { take: 1000, skip: 0 },
    })

    const affectedCartIds: string[] = []

    for (const cart of carts ?? []) {
      if ((cart as any).completed_at) {
        continue
      }

      const staleIds = (cart.items ?? [])
        .filter(
          (item: any) =>
            (productIds.length && productIds.includes(item.product_id)) ||
            (variantIds.length && variantIds.includes(item.variant_id))
        )
        .map((item: any) => item.id)

      if (!staleIds.length) {
        continue
      }

      try {
        await deleteLineItemsWorkflow(container).run({
          input: { cart_id: cart.id, ids: staleIds },
        })
        affectedCartIds.push(cart.id)
      } catch (err) {
        logger.warn(
          `Не вдалося прибрати видалений товар із кошика ${cart.id}: ${err}`
        )
      }
    }

    return new StepResponse({ affected_cart_ids: affectedCartIds })
  }
)