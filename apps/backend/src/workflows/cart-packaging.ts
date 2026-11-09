import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  acquireLockStep,
  addToCartWorkflow,
  deleteLineItemsWorkflow,
  refreshCartItemsWorkflow,
  releaseLockStep,
  updateLineItemInCartWorkflow,
  updateLineItemsStep,
  updateLineItemsStepWithSelector,
  useQueryGraphStep,
  validateCartStep,
} from "@medusajs/medusa/core-flows"
import type {
  UpdateLineItemInCartWorkflowInputDTO,
  UpdateLineItemWithoutSelectorDTO,
} from "@medusajs/framework/types"
import {
  computeCartPackagingSyncStep,
  LinePackagingChange,
  PACKAGING_CART_FIELDS,
  PackagingCart,
  resolveLinePackagingChangeStep,
  resolvePackagedLineStep,
} from "./steps/packaging-steps"

function getPackagingCartStep(cartId: string) {
  return useQueryGraphStep({
    entity: "cart",
    fields: PACKAGING_CART_FIELDS,
    filters: { id: cartId },
    options: { throwIfKeyNotFound: true, isList: false },
  }).config({ name: "get-packaging-cart" })
}

export type AddPackagedItemToCartWorkflowInput = {
  cart_id: string
  variant_id: string
  quantity: number
  packaging_variant_id: string
}

export const addPackagedItemToCartWorkflow = createWorkflow(
  { name: "add-packaged-item-to-cart", idempotent: false },
  (input: AddPackagedItemToCartWorkflowInput) => {
    acquireLockStep({ key: input.cart_id, timeout: 2, ttl: 10 })

    const { data } = getPackagingCartStep(input.cart_id)
    const cart = transform({ data }, ({ data }) => data as unknown as PackagingCart)
    validateCartStep({ cart: data as any })

    const resolved = resolvePackagedLineStep({
      cart,
      variant_id: input.variant_id,
      packaging_variant_id: input.packaging_variant_id,
    })

    when("packaged-line-exists", { resolved }, ({ resolved }) => !!resolved.existing_item).then(
      () => {
        const update = transform({ input, resolved }, ({ input, resolved }) => ({
          cart_id: input.cart_id,
          item_id: resolved.existing_item!.id,
          update: {
            quantity: resolved.existing_item!.quantity + input.quantity,
            unit_price: resolved.line.unit_price,
            compare_at_unit_price: resolved.line.compare_at_unit_price,
            metadata: resolved.line.metadata,
          },
        }) as UpdateLineItemInCartWorkflowInputDTO)
        updateLineItemInCartWorkflow.runAsStep({ input: update })
      }
    )

    when("packaged-line-new", { resolved }, ({ resolved }) => !resolved.existing_item).then(
      () => {
        const add = transform({ input, resolved }, ({ input, resolved }) => ({
          cart_id: input.cart_id,
          items: [
            {
              variant_id: input.variant_id,
              quantity: input.quantity,
              unit_price: resolved.line.unit_price,
              ...(resolved.line.compare_at_unit_price !== null
                ? { compare_at_unit_price: resolved.line.compare_at_unit_price }
                : {}),
              metadata: resolved.line.metadata,
            },
          ],
        }))
        addToCartWorkflow.runAsStep({ input: add })
      }
    )

    releaseLockStep({ key: input.cart_id })

    return new WorkflowResponse(void 0)
  }
)

export type ChangeLineItemPackagingWorkflowInput = {
  cart_id: string
  item_id: string
  packaging_variant_id: string | null
}

export const changeLineItemPackagingWorkflow = createWorkflow(
  { name: "change-line-item-packaging", idempotent: false },
  (input: ChangeLineItemPackagingWorkflowInput) => {
    acquireLockStep({ key: input.cart_id, timeout: 2, ttl: 10 })

    const { data } = getPackagingCartStep(input.cart_id)
    const cart = transform({ data }, ({ data }) => data as unknown as PackagingCart)
    validateCartStep({ cart: data as any })

    const change = resolveLinePackagingChangeStep({
      cart,
      item_id: input.item_id,
      packaging_variant_id: input.packaging_variant_id,
    })

    when("merge-packaging-lines", { change }, ({ change }) => change.action === "merge").then(
      () => {
        const merge = transform(
          { change },
          ({ change }) => change as Extract<LinePackagingChange, { action: "merge" }>
        )
        const remove = transform({ input, merge }, ({ input, merge }) => ({
          cart_id: input.cart_id,
          ids: [merge.remove_item_id],
        }))
        deleteLineItemsWorkflow.runAsStep({ input: remove })

        const update = transform({ input, merge }, ({ input, merge }) => ({
          cart_id: input.cart_id,
          item_id: merge.into_item_id,
          update: {
            quantity: merge.quantity,
            ...(merge.line
              ? {
                  unit_price: merge.line.unit_price,
                  compare_at_unit_price: merge.line.compare_at_unit_price,
                  metadata: merge.line.metadata,
                }
              : {}),
          },
        }) as UpdateLineItemInCartWorkflowInputDTO)
        updateLineItemInCartWorkflow.runAsStep({ input: update })
      }
    )

    when("update-packaging-line", { change }, ({ change }) => change.action === "update").then(
      () => {
        const update = transform({ change }, ({ change }) => {
          const { item_id, data } = change as Extract<
            LinePackagingChange,
            { action: "update" }
          >
          return { selector: { id: item_id }, data }
        })
        updateLineItemsStepWithSelector(update as any)

        refreshCartItemsWorkflow.runAsStep({
          input: { cart_id: input.cart_id, force_refresh: true },
        })
      }
    )

    releaseLockStep({ key: input.cart_id })

    return new WorkflowResponse(void 0)
  }
)

export const syncCartPackagingWorkflow = createWorkflow(
  { name: "sync-cart-packaging", idempotent: false },
  (input: { cart_id: string }) => {
    acquireLockStep({ key: input.cart_id, timeout: 2, ttl: 10 })

    const { data } = getPackagingCartStep(input.cart_id)
    const cart = transform({ data }, ({ data }) => data as unknown as PackagingCart)

    const sync = computeCartPackagingSyncStep({ cart })

    when("packaging-prices-changed", { sync }, ({ sync }) => sync.updates.length > 0).then(
      () => {
        const items = transform({ input, sync }, ({ input, sync }) => ({
          id: input.cart_id,
          items: sync.updates as unknown as UpdateLineItemWithoutSelectorDTO[],
        }))
        updateLineItemsStep(items)

        refreshCartItemsWorkflow.runAsStep({
          input: { cart_id: input.cart_id, force_refresh: true },
        })
      }
    )

    releaseLockStep({ key: input.cart_id })

    const result = transform({ sync }, ({ sync }) => ({
      changed: sync.updates.length > 0,
      unavailable: sync.unavailable,
    }))

    return new WorkflowResponse(result)
  }
)
