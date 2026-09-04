import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { capturePaymentWorkflow } from "@medusajs/core-flows"
import { MonoLedgerRepository } from "../modules/mono-payment/repository"
import { fromMinorUnits } from "../modules/mono-payment/money"

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
      fields: [
        "id",
        "payment_collections.captured_amount",
        "payment_collections.payment_sessions.data",
        "payment_collections.payment_sessions.provider_id",
        "payment_collections.payments.id",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.data",
      ],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) return

    const monoSession = order.payment_collections
      ?.flatMap((pc: any) => pc.payment_sessions ?? [])
      ?.find((ps: any) =>
        ["pp_mono_mono", "pp_mono-prepayment_mono-prepayment"].includes(
          ps.provider_id
        )
      )
    const monoPayment = order.payment_collections
      ?.flatMap((pc: any) => pc.payments ?? [])
      ?.find((payment: any) =>
        ["pp_mono_mono", "pp_mono-prepayment_mono-prepayment"].includes(
          payment.provider_id
        )
      )

    const invoiceId = (monoSession?.data?.mono_invoice_id ??
      monoPayment?.data?.mono_invoice_id) as string | undefined
    if (!invoiceId) return

    const ledger = new MonoLedgerRepository(pg)
    await ledger.attachOrder(invoiceId, order.id)

    const invoice = await ledger.findByInvoiceId(invoiceId)
    const prepaymentAmount = invoice
      ? fromMinorUnits(invoice.amount_minor, invoice.currency_code)
      : 0
    const collection = order.payment_collections?.find((pc: any) =>
      pc.payment_sessions?.some((ps: any) => ps.data?.mono_invoice_id === invoiceId) ||
      pc.payments?.some((payment: any) => payment.data?.mono_invoice_id === invoiceId)
    )
    const payment = collection?.payments?.find(
      (candidate: any) => candidate.data?.mono_invoice_id === invoiceId
    ) ?? monoPayment

    if (
      invoice?.status === "success" &&
      payment?.id &&
      Number(collection?.captured_amount ?? 0) < prepaymentAmount
    ) {
      await capturePaymentWorkflow(container).run({
        input: { payment_id: payment.id, amount: prepaymentAmount },
      })
    }
  } catch (err) {
    logger.warn(`Plata by mono: could not link order ${data.id} to its invoice: ${err}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
