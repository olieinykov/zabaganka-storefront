import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../../../../../modules/mono-payment/repository"
import { buildMonoClientFromEnv } from "../../../../../modules/mono-payment/env-client"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const sessionId = req.query.session_id as string | undefined
  if (!sessionId) {
    res.status(400).json({ message: "session_id is required" })
    return
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const ledger = new MonoLedgerRepository(pg)

  const invoice = await ledger.findByPaymentSessionId(sessionId)
  if (!invoice) {
    res.status(404).json({ message: "Unknown payment session" })
    return
  }

  if (
    invoice.invoice_id &&
    (invoice.status === "created" || invoice.status === "processing")
  ) {
    try {
      const client = buildMonoClientFromEnv(logger)
      if (client) {
        const live = await client.getInvoiceStatus(invoice.invoice_id)
        await ledger.applyStatus({
          invoiceId: invoice.invoice_id,
          status: live.status,
          modifiedDate: live.modifiedDate,
          failureReason: live.failureReason,
          errCode: live.errCode,
          rawPayload: live as unknown as Record<string, unknown>,
        })
        invoice.status = live.status as typeof invoice.status
        invoice.failure_reason = live.failureReason ?? invoice.failure_reason
      }
    } catch (err) {
      logger.warn(`Plata by mono: status poll reconciliation failed for ${sessionId}: ${err}`)
    }
  }

  const readyToCompleteOrder = invoice.status === "hold" || invoice.status === "success"
  const stillWaiting = invoice.status === "created" || invoice.status === "processing"
  const failed = ["failure", "expired", "removed"].includes(invoice.status)

  res.json({
    status: invoice.status,
    ready_to_complete_order: readyToCompleteOrder,
    still_waiting: stillWaiting,
    failed,
    failure_reason: failed ? invoice.failure_reason : undefined,
    order_id: invoice.order_id,
  })
}
