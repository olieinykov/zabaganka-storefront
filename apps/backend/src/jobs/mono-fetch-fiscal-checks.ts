import type { MedusaContainer, Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../modules/mono-payment/repository"
import { buildMonoClientFromEnv } from "../modules/mono-payment/env-client"

const RECHECK_AFTER_MINUTES = 5
const STOP_CHECKING_AFTER_HOURS = 24

export default async function monoFetchFiscalChecksJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const ledger = new MonoLedgerRepository(pg)

  const client = buildMonoClientFromEnv(logger)
  if (!client) {
    return
  }

  const pending = await ledger.listPendingFiscalCheckLookups({
    recheckAfterMinutes: RECHECK_AFTER_MINUTES,
    stopCheckingAfterHours: STOP_CHECKING_AFTER_HOURS,
  })
  if (!pending.length) {
    return
  }

  logger.info(`Plata by mono: checking fiscal-check status for ${pending.length} invoice(s).`)

  for (const invoice of pending) {
    if (!invoice.invoice_id) continue

    try {
      const result = await client.getFiscalChecks(invoice.invoice_id)
      const check = result.checks?.[0]

      if (check?.taxUrl) {
        await ledger.recordFiscalCheck(invoice.invoice_id, {
          url: check.taxUrl,
          status: check.status,
        })
        logger.info(`Plata by mono: fiscal check found for invoice ${invoice.invoice_id}.`)
      } else {
        await ledger.recordFiscalCheck(invoice.invoice_id, { url: null, status: null })
      }
    } catch (err) {
      logger.warn(
        `Plata by mono: fiscal-checks lookup failed for invoice ${invoice.invoice_id}, will retry: ${err}`
      )
    }
  }
}

export const config = {
  name: "mono-fetch-fiscal-checks",
  schedule: "*/5 * * * *",
}
