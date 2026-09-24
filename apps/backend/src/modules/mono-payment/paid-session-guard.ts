import type { Logger } from "@medusajs/framework/types"
import { MonoLedgerRepository, type MonoInvoiceRow } from "./repository"
import { buildMonoClientFromEnv } from "./env-client"

export const MONO_PROVIDER_IDS = [
  "pp_mono_mono",
  "pp_mono-prepayment_mono-prepayment",
]

const LOCKED_STATUSES = ["processing", "hold", "success"]

type SessionLike = { id: string; provider_id: string }

export async function findLockedMonoInvoice(
  pg: any,
  logger: Logger,
  sessions: SessionLike[]
): Promise<MonoInvoiceRow | null> {
  const monoSessionIds = sessions
    .filter((session) => MONO_PROVIDER_IDS.includes(session.provider_id))
    .map((session) => session.id)

  if (!monoSessionIds.length) {
    return null
  }

  const ledger = new MonoLedgerRepository(pg)
  const invoices = await ledger.findByPaymentSessionIds(monoSessionIds)

  for (const invoice of invoices) {
    let status = invoice.status

    if (invoice.invoice_id && status === "created") {
      const client = buildMonoClientFromEnv(logger)
      if (client) {
        try {
          const live = await client.getInvoiceStatus(invoice.invoice_id)
          await ledger.applyStatus({
            invoiceId: invoice.invoice_id,
            status: live.status,
            modifiedDate: live.modifiedDate,
            failureReason: live.failureReason,
            errCode: live.errCode,
            rawPayload: live as unknown as Record<string, unknown>,
          })
          status = live.status as MonoInvoiceRow["status"]
        } catch (err) {
          logger.warn(
            `Plata by mono: live status check for ${invoice.invoice_id} failed, using cached state: ${err}`
          )
        }
      }
    }

    if (LOCKED_STATUSES.includes(status)) {
      return { ...invoice, status }
    }
  }

  return null
}
