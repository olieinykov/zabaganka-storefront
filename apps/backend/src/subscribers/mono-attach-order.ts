import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MonoLedgerRepository } from "../modules/mono-payment/repository"

export default async function monoAttachOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.payment_sessions.data", "payment_collections.payment_sessions.provider_id"],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) return

    const monoSession = order.payment_collections
      ?.flatMap((pc: any) => pc.payment_sessions ?? [])
      ?.find((ps: any) => ps.provider_id === "pp_mono_mono")

    const invoiceId = monoSession?.data?.mono_invoice_id as string | undefined
    if (!invoiceId) return

    const ledger = new MonoLedgerRepository(pg)
    await ledger.attachOrder(invoiceId, order.id)
  } catch (err) {
    logger.warn(`Plata by mono: could not link order ${data.id} to its invoice: ${err}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
