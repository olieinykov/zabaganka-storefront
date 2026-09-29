import {
  defineMiddlewares,
  validateAndTransformBody,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { isVideoUrl } from "../lib/product-video"
import { findLockedMonoInvoice } from "../modules/mono-payment/paid-session-guard"
import { PRODUCT_MEDIA_MODULE } from "../modules/product-media"
import ProductMediaModuleService from "../modules/product-media/service"
import {
  AdminCreateProductVideos,
  AdminReorderProductVideos,
} from "./admin/products/[id]/videos/validators"

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

const VIDEO_AS_PRODUCT_IMAGE_MESSAGE =
  "Відео не можна використовувати як обкладинку (thumbnail) чи зображення товару. " +
  "Додайте його в блоці «Відео товару»."

type ProductMediaPayload = {
  thumbnail?: unknown
  images?: unknown
}

function collectProductMediaUrls(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return []
  }

  const { thumbnail, images } = payload as ProductMediaPayload
  const urls: string[] = []

  if (typeof thumbnail === "string" && thumbnail) {
    urls.push(thumbnail)
  }
  if (Array.isArray(images)) {
    for (const image of images) {
      const url = (image as { url?: unknown } | null)?.url
      if (typeof url === "string" && url) {
        urls.push(url)
      }
    }
  }

  return urls
}

async function guardProductVideoAsImage(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as
    | (ProductMediaPayload & { create?: unknown; update?: unknown })
    | undefined

  const payloads = req.path.endsWith("/batch")
    ? [
        ...(Array.isArray(body?.create) ? body.create : []),
        ...(Array.isArray(body?.update) ? body.update : []),
      ]
    : [body]

  const urls = payloads.flatMap(collectProductMediaUrls)
  if (!urls.length) {
    return next()
  }

  if (urls.some(isVideoUrl)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      VIDEO_AS_PRODUCT_IMAGE_MESSAGE
    )
  }

  const productMedia: ProductMediaModuleService =
    req.scope.resolve(PRODUCT_MEDIA_MODULE)
  const [video] = await productMedia.listProductVideoFiles(
    { url: urls },
    { take: 1, select: ["id"] }
  )
  if (video) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      VIDEO_AS_PRODUCT_IMAGE_MESSAGE
    )
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      methods: ["POST"],
      middlewares: [guardProductVideoAsImage],
    },
    {
      matcher: "/admin/products/batch",
      methods: ["POST"],
      middlewares: [guardProductVideoAsImage],
    },
    {
      matcher: "/admin/products/:id",
      methods: ["POST"],
      middlewares: [guardProductVideoAsImage],
    },
    {
      matcher: "/admin/products/:id/videos",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateProductVideos)],
    },
    {
      matcher: "/admin/products/:id/videos/reorder",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminReorderProductVideos)],
    },
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
