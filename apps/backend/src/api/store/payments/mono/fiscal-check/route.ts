import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../../../../../modules/mono-payment/repository"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const orderId = req.query.order_id as string | undefined
  if (!orderId) {
    res.status(400).json({ message: "order_id is required" })
    return
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const ledger = new MonoLedgerRepository(pg)

  const invoice = await ledger.findByOrderId(orderId)

  res.json({
    available: !!invoice?.fiscal_check_url,
    tax_url: invoice?.fiscal_check_url ?? null,
    status: invoice?.fiscal_check_status ?? null,
  })
}
