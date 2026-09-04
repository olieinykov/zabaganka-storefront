import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CheckoutOptionsRepository } from "../../../../modules/checkout-options/repository"
import { fromMinorUnits } from "../../../../modules/mono-payment/money"


export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const repo = new CheckoutOptionsRepository(pg)

  const settings = await repo.getPrepaymentSettings()

  res.json({
    amount: fromMinorUnits(settings.amount_minor, settings.currency_code),
    currency_code: settings.currency_code,
  })
}
