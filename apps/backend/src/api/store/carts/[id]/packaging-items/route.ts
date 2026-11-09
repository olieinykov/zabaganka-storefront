import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addPackagedItemToCartWorkflow } from "../../../../../workflows/cart-packaging"
import type { StoreAddPackagedItemType } from "./validators"

/**
 * POST /store/carts/:id/packaging-items
 *
 * Adds a product variant together with a paid packaging option. Only ids
 * come from the client; the line price is computed on the server. Adding a
 * product with the default (free) packaging uses the regular
 * `POST /store/carts/:id/line-items`.
 */
export async function POST(
  req: MedusaRequest<StoreAddPackagedItemType>,
  res: MedusaResponse
): Promise<void> {
  await addPackagedItemToCartWorkflow(req.scope).run({
    input: {
      cart_id: req.params.id,
      variant_id: req.validatedBody.variant_id,
      quantity: req.validatedBody.quantity,
      packaging_variant_id: req.validatedBody.packaging_variant_id,
    },
  })

  res.json({ cart: { id: req.params.id } })
}
