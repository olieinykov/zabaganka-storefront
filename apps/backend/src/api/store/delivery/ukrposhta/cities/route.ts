import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { UkrposhtaClient } from "../../../../../modules/ukrposhta-fulfillment/client"

/**
 * GET /store/delivery/ukrposhta/cities?q=київ
 *
 * PLACEHOLDER — see src/modules/ukrposhta-fulfillment/client.ts. Falls back to
 * a small fixture city list until UKRPOSHTA_API_BASE_URL / UKRPOSHTA_BEARER_TOKEN
 * are configured with real, contract-issued credentials.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = (req.query.q as string | undefined)?.trim()

  if (!query || query.length < 2) {
    res.json({ cities: [] })
    return
  }

  const client = new UkrposhtaClient({
    apiBaseUrl: process.env.UKRPOSHTA_API_BASE_URL,
    bearerToken: process.env.UKRPOSHTA_BEARER_TOKEN,
    userToken: process.env.UKRPOSHTA_USER_TOKEN,
  })

  const cities = await client.getCities(query)

  res.json({
    cities: cities.map((city) => ({
      ref: city.id,
      name: city.name,
      area: city.region,
    })),
  })
}
