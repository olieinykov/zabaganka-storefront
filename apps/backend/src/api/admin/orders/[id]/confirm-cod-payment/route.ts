import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { capturePaymentWorkflow } from "@medusajs/core-flows"
import { MonoLedgerRepository } from "../../../../../modules/mono-payment/repository"

const MONO_PREPAYMENT_PROVIDER = "pp_mono-prepayment_mono-prepayment"


export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const orderId = req.params.id

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "total",
      "payment_collections.captured_amount",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
    ],
    filters: { id: orderId },
  })

  const order = orders[0] as any
  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order was not found")
  }

  const collection = order.payment_collections?.find((pc: any) =>
    pc.payments?.some(
      (payment: any) => payment.provider_id === MONO_PREPAYMENT_PROVIDER
    )
  )
  const payment = collection?.payments?.find(
    (candidate: any) => candidate.provider_id === MONO_PREPAYMENT_PROVIDER
  )

  if (!collection || !payment) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "This order does not use mono prepayment"
    )
  }

  const ledger = new MonoLedgerRepository(pg)
  const invoice = await ledger.findByOrderId(orderId)
  if (invoice?.status !== "success") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The mono prepayment has not been confirmed"
    )
  }

  const remaining = Number(order.total) - Number(collection.captured_amount ?? 0)
  if (remaining <= 0) {
    res.json({ order_id: orderId, captured_amount: collection.captured_amount, remaining: 0 })
    return
  }

  await capturePaymentWorkflow(req.scope).run({
    input: { payment_id: payment.id, amount: remaining },
  })

  res.json({
    order_id: orderId,
    captured_amount: Number(collection.captured_amount ?? 0) + remaining,
    remaining: 0,
  })
}
