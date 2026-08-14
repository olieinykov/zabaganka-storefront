import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { UkrposhtaClient } from "../../../../../modules/ukrposhta-fulfillment/client"

/**
 * GET /store/delivery/ukrposhta/warehouses?cityRef=...&q=...
 *
 * PLACEHOLDER — see src/modules/ukrposhta-fulfillment/client.ts. Falls back to
 * a small fixture warehouse list until UKRPOSHTA_API_BASE_URL / UKRPOSHTA_BEARER_TOKEN
 * are configured with real, contract-issued credentials.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const cityRef = req.query.cityRef as string | undefined
  const query = req.query.q as string | undefined

  if (!cityRef) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "cityRef is required")
  }

  const client = new UkrposhtaClient({
    apiBaseUrl: process.env.UKRPOSHTA_API_BASE_URL,
    bearerToken: process.env.UKRPOSHTA_BEARER_TOKEN,
    userToken: process.env.UKRPOSHTA_USER_TOKEN,
  })

  const warehouses = await client.getWarehouses(cityRef, query)

  res.json({
    warehouses: warehouses.map((wh) => ({
      ref: wh.id,
      name: wh.name,
      shortAddress: wh.address,
      cityRef: wh.cityId,
    })),
  })
}
