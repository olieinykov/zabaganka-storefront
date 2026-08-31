import type { MedusaContainer } from "@medusajs/framework/types"
import type { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../modules/mono-payment/repository"
import { buildMonoClientFromEnv } from "../modules/mono-payment/env-client"

export default async function monoExpireInvoicesJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const ledger = new MonoLedgerRepository(pg)

  const client = buildMonoClientFromEnv(logger)
  if (!client) {
    return
  }

  const expirable = await ledger.listExpirableAttempts(new Date())
  if (!expirable.length) {
    return
  }

  logger.info(`Plata by mono: sweeping ${expirable.length} expired/expiring invoice(s).`)

  for (const invoice of expirable) {
    if (!invoice.invoice_id) {
      continue
    }

    try {
      const live = await client.getInvoiceStatus(invoice.invoice_id)

      if (live.status !== "created" && live.status !== "processing") {
        await ledger.applyStatus({
          invoiceId: invoice.invoice_id,
          status: live.status,
          modifiedDate: live.modifiedDate,
          failureReason: live.failureReason,
          errCode: live.errCode,
          rawPayload: live as unknown as Record<string, unknown>,
        })
        logger.info(
          `Plata by mono: invoice ${invoice.invoice_id} was actually "${live.status}" (webhook likely missed) — reconciled instead of expiring.`
        )
        continue
      }

      await client.removeInvoice(invoice.invoice_id)
    } catch (err) {
      logger.warn(
        `Plata by mono: could not reach mono while expiring invoice ${invoice.invoice_id}, will retry next run: ${err}`
      )
      continue
    }

    await ledger.applyStatus({
      invoiceId: invoice.invoice_id,
      status: "expired",
      modifiedDate: new Date().toISOString(),
    })
  }
}

export const config = {
  name: "mono-expire-invoices",
  schedule: "*/5 * * * *",
}
