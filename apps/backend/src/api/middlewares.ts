import {
  defineMiddlewares,
  validateAndTransformBody,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { hasPackagingKey } from "../lib/packaging"
import { isVideoUrl } from "../lib/product-video"
import { findLockedMonoInvoice } from "../modules/mono-payment/paid-session-guard"
import { PRODUCT_MEDIA_MODULE } from "../modules/product-media"
import ProductMediaModuleService from "../modules/product-media/service"
import { syncCartPackagingWorkflow } from "../workflows/cart-packaging"
import {
  AdminCreatePackaging,
  AdminCreatePackagingVariant,
  AdminSetProductPackaging,
  AdminUpdatePackaging,
  AdminUpdatePackagingVariant,
  AdminUpsertDefaultPackaging,
} from "./admin/packagings/validators"
import {
  AdminCreateProductVideos,
  AdminReorderProductVideos,
} from "./admin/products/[id]/videos/validators"
import {
  StoreAddPackagedItem,
  StoreChangeLineItemPackaging,
} from "./store/carts/[id]/packaging-items/validators"

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

function guardPackagingMetadata(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as
    | { metadata?: unknown; items?: unknown }
    | undefined

  const itemMetadata = Array.isArray(body?.items)
    ? body.items.map((item) => (item as { metadata?: unknown } | null)?.metadata)
    : []

  if ([body?.metadata, ...itemMetadata].some(hasPackagingKey)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Пакування можна обрати лише через спеціальний вибір пакування."
    )
  }

  next()
}

const PACKAGING_PRICE_CHANGED_MESSAGE =
  "Вартість товарів з пакуванням у кошику оновилася. Перевірте суму замовлення і спробуйте ще раз."

async function syncPackagingBeforePayment(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: collections } = await query.graph({
    entity: "payment_collection",
    fields: ["id", "cart.id"],
    filters: { id: req.params.id },
  })

  const cartId = (collections[0] as { cart?: { id?: string } | null } | undefined)
    ?.cart?.id
  if (!cartId) {
    return next()
  }

  const { result } = await syncCartPackagingWorkflow(req.scope).run({
    input: { cart_id: cartId },
  })

  if (result.unavailable.length) {
    const lines = result.unavailable
      .map((line) => `«${line.packaging_title}» для «${line.product_title}»`)
      .join(", ")
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Пакування ${lines} більше недоступне. Оберіть інше пакування в кошику.`
    )
  }

  if (result.changed) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      PACKAGING_PRICE_CHANGED_MESSAGE
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
      matcher: "/admin/packaging-default",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminUpsertDefaultPackaging)],
    },
    {
      matcher: "/admin/packagings",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreatePackaging)],
    },
    {
      matcher: "/admin/packagings/:id",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminUpdatePackaging)],
    },
    {
      matcher: "/admin/packagings/:id/variants",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreatePackagingVariant)],
    },
    {
      matcher: "/admin/packagings/:id/variants/:variant_id",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminUpdatePackagingVariant)],
    },
    {
      matcher: "/admin/products/:id/packaging",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminSetProductPackaging)],
    },
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      methods: ["POST"],
      middlewares: [guardPaymentCollection, syncPackagingBeforePayment],
    },
    {
      matcher: "/store/carts",
      methods: ["POST"],
      middlewares: [guardPackagingMetadata],
    },
    {
      matcher: "/store/carts/:id",
      methods: ["POST"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/line-items",
      methods: ["POST"],
      middlewares: [guardCart, guardPackagingMetadata],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      methods: ["POST"],
      middlewares: [guardCart, guardPackagingMetadata],
    },
    {
      matcher: "/store/carts/:id/line-items/:line_id",
      methods: ["DELETE"],
      middlewares: [guardCart],
    },
    {
      matcher: "/store/carts/:id/packaging-items",
      methods: ["POST"],
      middlewares: [guardCart, validateAndTransformBody(StoreAddPackagedItem)],
    },
    {
      matcher: "/store/carts/:id/packaging-items/:line_id",
      methods: ["POST"],
      middlewares: [
        guardCart,
        validateAndTransformBody(StoreChangeLineItemPackaging),
      ],
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
