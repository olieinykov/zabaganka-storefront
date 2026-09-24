import type { MedusaContainer, Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MonoLedgerRepository } from "../modules/mono-payment/repository"

const SETTLED_BEFORE_MINUTES = 2
const RECHECK_AFTER_MINUTES = 10
const STOP_CHECKING_AFTER_HOURS = 72

export default async function monoCompletePaidOrdersJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as Logger
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const ledger = new MonoLedgerRepository(pg)

  const pending = await ledger.listPaidWithoutOrder({
    settledBeforeMinutes: SETTLED_BEFORE_MINUTES,
    recheckAfterMinutes: RECHECK_AFTER_MINUTES,
    stopCheckingAfterHours: STOP_CHECKING_AFTER_HOURS,
  })
  if (!pending.length) {
    return
  }

  logger.info(`Plata by mono: ${pending.length} paid invoice(s) without an order, completing.`)

  for (const invoice of pending) {
    try {
      const { data: sessions } = await query.graph({
        entity: "payment_session",
        fields: ["id", "payment_collection_id"],
        filters: { id: invoice.payment_session_id },
      })
      const paymentCollectionId = sessions[0]?.payment_collection_id
      if (!paymentCollectionId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `payment session ${invoice.payment_session_id} no longer exists; the payment has to be matched or refunded manually`
        )
      }

      const { data: cartLinks } = await query.graph({
        entity: "cart_payment_collection",
        fields: ["cart_id"],
        filters: { payment_collection_id: paymentCollectionId },
      })
      const cartId = cartLinks[0]?.cart_id
      if (!cartId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `no cart is linked to payment collection ${paymentCollectionId}`
        )
      }

      const { result } = await completeCartWorkflow(container).run({
        input: { id: cartId },
      })

      if (result?.id && invoice.invoice_id) {
        await ledger.attachOrder(invoice.invoice_id, result.id)
      }
      await ledger.recordOrderCompletionAttempt(invoice.id, null)

      logger.info(
        `Plata by mono: completed cart ${cartId} as order ${result?.id} for paid invoice ${invoice.invoice_id} (customer did not return to the store).`
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await ledger.recordOrderCompletionAttempt(invoice.id, message)
      logger.error(
        `Plata by mono: invoice ${invoice.invoice_id} is paid but no order could be created, will retry: ${message}`
      )
    }
  }
}

export const config = {
  name: "mono-complete-paid-orders",
  schedule: "* * * * *",
}
