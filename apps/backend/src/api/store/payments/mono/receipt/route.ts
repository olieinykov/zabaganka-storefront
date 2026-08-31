import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../../../../../modules/mono-payment/repository"
import { buildMonoClientFromEnv } from "../../../../../modules/mono-payment/env-client"

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const orderId = req.query.order_id as string | undefined
  const email = req.query.email as string | undefined

  if (!orderId) {
    res.status(400).json({ message: "order_id is required" })
    return
  }

  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const ledger = new MonoLedgerRepository(pg)

  const invoice = await ledger.findByOrderId(orderId)
  if (!invoice || !invoice.invoice_id || invoice.status !== "success") {
    res.status(404).json({ message: "No paid mono invoice found for this order" })
    return
  }

  const client = buildMonoClientFromEnv(logger)
  if (!client) {
    res.status(503).json({ message: "Plata by mono is not configured" })
    return
  }

  try {
    const receipt = await client.getReceipt(invoice.invoice_id, email)
    const pdf = Buffer.from(receipt.file, "base64")

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${invoice.invoice_id}.pdf"`,
      "Content-Length": pdf.length,
    })
    res.send(pdf)
  } catch (err) {
    logger.error(`Plata by mono: failed to fetch receipt for ${invoice.invoice_id}: ${err}`)
    res.status(502).json({ message: "Could not retrieve receipt from mono" })
  }
}
