import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { ICacheService } from "@medusajs/framework/types"
import { NovaPoshtaClient } from "../../../../../modules/nova-poshta-fulfillment/client"
import { NP_POSTOMAT_TYPE_REF } from "../../../../../modules/nova-poshta-fulfillment/types"


const CACHE_TTL_SECONDS = 600

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

  const cache = req.scope.resolve<ICacheService>(Modules.CACHE)
  const cacheKey = `np:warehouses:${cityRef}:${type}:${(query || "").toLowerCase()}`

  const cached = await cache.get<{ warehouses: unknown[] }>(cacheKey)
  if (cached) {
    res.json(cached)
    return
  }

  const client = new NovaPoshtaClient({
    apiKey: process.env.NOVA_POSHTA_API_KEY as string,
  })

  const warehouses = await client.getWarehouses({
    cityRef,
    query,
    typeOfWarehouseRef: type === "postomat" ? NP_POSTOMAT_TYPE_REF : undefined,
  })

  const payload = {
    warehouses: warehouses.map((wh) => ({
      ref: wh.Ref,
      name: wh.Description,
      number: wh.Number,
      shortAddress: wh.ShortAddress,
      cityRef: wh.CityRef,
    })),
  }

  await cache.set(cacheKey, payload, CACHE_TTL_SECONDS)

  res.json(payload)
}