import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { NovaPoshtaClient } from "../../../../../modules/nova-poshta-fulfillment/client"
import { NP_POSTOMAT_TYPE_REF } from "../../../../../modules/nova-poshta-fulfillment/types"

/**
 * GET /store/delivery/nova-poshta/warehouses?cityRef=...&q=...&type=warehouse|postomat
 *
 * Proxies Nova Poshta's AddressGeneral.getWarehouses so the storefront never
 * needs the NOVA_POSHTA_API_KEY. Used to power the warehouse/postomat
 * autocomplete in checkout once a city has been chosen.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const cityRef = req.query.cityRef as string | undefined
  const query = req.query.q as string | undefined
  const type = (req.query.type as string | undefined) || "warehouse"

  if (!cityRef) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "cityRef is required")
  }

  const client = new NovaPoshtaClient({
    apiKey: process.env.NOVA_POSHTA_API_KEY as string,
  })

  const warehouses = await client.getWarehouses({
    cityRef,
    query,
    typeOfWarehouseRef: type === "postomat" ? NP_POSTOMAT_TYPE_REF : undefined,
  })

  res.json({
    warehouses: warehouses.map((wh) => ({
      ref: wh.Ref,
      name: wh.Description,
      number: wh.Number,
      shortAddress: wh.ShortAddress,
      cityRef: wh.CityRef,
    })),
  })
}
