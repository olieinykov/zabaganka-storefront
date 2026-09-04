import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"


export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.json({
    max_weight_kg: process.env.NOVA_POSHTA_POSTOMAT_MAX_WEIGHT_KG
      ? Number(process.env.NOVA_POSHTA_POSTOMAT_MAX_WEIGHT_KG)
      : 20,
    max_length_cm: process.env.NOVA_POSHTA_POSTOMAT_MAX_LENGTH_CM
      ? Number(process.env.NOVA_POSHTA_POSTOMAT_MAX_LENGTH_CM)
      : 40,
    max_width_cm: process.env.NOVA_POSHTA_POSTOMAT_MAX_WIDTH_CM
      ? Number(process.env.NOVA_POSHTA_POSTOMAT_MAX_WIDTH_CM)
      : 38,
    max_height_cm: process.env.NOVA_POSHTA_POSTOMAT_MAX_HEIGHT_CM
      ? Number(process.env.NOVA_POSHTA_POSTOMAT_MAX_HEIGHT_CM)
      : 40,
    default_item_weight_kg: process.env.NOVA_POSHTA_DEFAULT_ITEM_WEIGHT_KG
      ? Number(process.env.NOVA_POSHTA_DEFAULT_ITEM_WEIGHT_KG)
      : 0.5,
    default_item_dimension_cm: process.env.NOVA_POSHTA_DEFAULT_ITEM_DIMENSION_CM
      ? Number(process.env.NOVA_POSHTA_DEFAULT_ITEM_DIMENSION_CM)
      : 20,
  })
}
