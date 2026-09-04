import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CheckoutOptionsRepository } from "../../../../modules/checkout-options/repository"
import { toMinorUnits, fromMinorUnits } from "../../../../modules/mono-payment/money"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const repo = new CheckoutOptionsRepository(pg)

  const settings = await repo.getPrepaymentSettings()

  res.json({
    amount: fromMinorUnits(settings.amount_minor, settings.currency_code),
    currency_code: settings.currency_code,
    updated_at: settings.updated_at,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const body = (req.body ?? {}) as { amount?: unknown; currency_code?: unknown }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount < 0) {
    res.status(400).json({
      message: "`amount` is required and must be a non-negative number (major units, e.g. 500 for 500 грн).",
    })
    return
  }

  const currencyCode =
    typeof body.currency_code === "string" && body.currency_code
      ? body.currency_code.toLowerCase()
      : "uah"

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const repo = new CheckoutOptionsRepository(pg)

  const updated = await repo.setPrepaymentSettings({
    amountMinor: toMinorUnits(amount, currencyCode),
    currencyCode,
  })

  res.json({
    amount: fromMinorUnits(updated.amount_minor, updated.currency_code),
    currency_code: updated.currency_code,
    updated_at: updated.updated_at,
  })
}
