import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { findLockedMonoInvoice } from "../modules/mono-payment/paid-session-guard"

const ALREADY_PAID_MESSAGE =
  "Це замовлення вже оплачено (або оплата саме зараз обробляється) в іншій вкладці. " +
  "Змінити спосіб оплати чи склад кошика вже не можна — ми завершуємо оформлення замовлення, " +
  "підтвердження надійде на вашу пошту. Оновіть сторінку."

type PaymentSessionLike = { id: string; provider_id: string } | null | undefined

async function assertNotPaid(req: MedusaRequest, sessions: PaymentSessionLike[]) {
  const pg = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const locked = await findLockedMonoInvoice(
    pg,
    logger,
    sessions.filter((session): session is NonNullable<PaymentSessionLike> => !!session)
  )
  if (locked) {
    logger.warn(
      `Plata by mono: blocked ${req.method} ${req.path} because payment session ${locked.payment_session_id} is already "${locked.status}".`
    )
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, ALREADY_PAID_MESSAGE)
  }
}

async function guardPaymentCollection(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: collections } = await query.graph({
    entity: "payment_collection",
    fields: ["id", "payment_sessions.id", "payment_sessions.provider_id"],
    filters: { id: req.params.id },
  })

  await assertNotPaid(req, collections[0]?.payment_sessions ?? [])
  next()
}

async function guardCart(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
    ],
    filters: { id: req.params.id },
  })

  await assertNotPaid(req, carts[0]?.payment_collection?.payment_sessions ?? [])
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      methods: ["POST"],
      middlewares: [guardPaymentCollection],
    },
    {
      matcher: "/store/carts/:id",
      methods: ["POST"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/line-items",
      methods: ["POST"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      methods: ["POST", "DELETE"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/shipping-methods",
      methods: ["POST"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/promotions",
      methods: ["POST", "DELETE"],
      middlewares: [guardCart],
    },
  ],
})
