import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../../../../../modules/mono-payment/repository"
import { buildMonoClientFromEnv } from "../../../../../modules/mono-payment/env-client"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const orderId = req.query.order_id as string | undefined
  const invoiceIdParam = req.query.invoice_id as string | undefined

  if (!orderId && !invoiceIdParam) {
    res.status(400).json({ message: "order_id or invoice_id is required" })
    return
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const ledger = new MonoLedgerRepository(pg)

  let invoiceId = invoiceIdParam ?? null
  if (!invoiceId && orderId) {
    const invoice = await ledger.findByOrderId(orderId)
    invoiceId = invoice?.invoice_id ?? null
  }

  if (!invoiceId) {
    res.status(404).json({ message: "No mono invoice found for this order" })
    return
  }

  const client = buildMonoClientFromEnv(logger)
  if (!client) {
    res.status(503).json({ message: "Plata by mono is not configured" })
    return
  }

  try {
    const result = await client.getFiscalChecks(invoiceId)
    res.json(result)
  } catch (err) {
    logger.error(`Plata by mono: failed to fetch fiscal checks for ${invoiceId}: ${err}`)
    res.status(502).json({ message: "Could not retrieve fiscal checks from mono" })
  }
}
