import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NovaPoshtaClient } from "../../../../../modules/nova-poshta-fulfillment/client"

/**
 * GET /store/delivery/nova-poshta/cities?q=київ
 *
 * Proxies Nova Poshta's Address.getCities so the storefront never needs the
 * NOVA_POSHTA_API_KEY. Used to power the city autocomplete in checkout.
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

  const client = new NovaPoshtaClient({
    apiKey: process.env.NOVA_POSHTA_API_KEY as string,
  })

  const cities = await client.getCities(query)

  res.json({
    cities: cities.map((city) => ({
      ref: city.Ref,
      name: city.Description,
      area: city.AreaDescription,
    })),
  })
}
