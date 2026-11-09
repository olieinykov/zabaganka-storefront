import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { changeLineItemPackagingWorkflow } from "../../../../../../workflows/cart-packaging"
import type { StoreChangeLineItemPackagingType } from "../validators"

/**
 * POST /store/carts/:id/packaging-items/:line_id
 *
 * Switches the packaging of a cart line; `packaging_variant_id: null` goes
 * back to the default free packaging.
 */
export async function POST(
  req: MedusaRequest<StoreChangeLineItemPackagingType>,
  res: MedusaResponse
): Promise<void> {
  await changeLineItemPackagingWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      item_id: req.params.line_id,
      packaging_variant_id: req.validatedBody.packaging_variant_id,
    },
  })

  res.json({ cart: { id: req.params.id } })
}
