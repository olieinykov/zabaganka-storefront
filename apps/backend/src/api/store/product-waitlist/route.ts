import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_WAITLIST_MODULE } from "../../../modules/product-waitlist"
import ProductWaitlistModuleService from "../../../modules/product-waitlist/service"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// +380 followed by exactly 9 digits (Ukrainian mobile numbers).
const PHONE_REGEX = /^\+380\d{9}$/

type CreateWaitlistBody = {
  product_id?: string
  variant_id?: string | null
  contact_method?: "email" | "phone"
  email?: string
  phone?: string
}

export async function POST(
  req: MedusaRequest<CreateWaitlistBody>,
  res: MedusaResponse
): Promise<void> {
  const { product_id, variant_id, contact_method, email, phone } =
    req.body || {}

  if (!product_id) {
    res.status(400).json({ message: "product_id is required" })
    return
  }

  if (contact_method !== "email" && contact_method !== "phone") {
    res
      .status(400)
      .json({ message: "contact_method must be 'email' or 'phone'" })
    return
  }

  let contact_value: string
  let normalizedEmail: string | null = null
  let normalizedPhone: string | null = null

  if (contact_method === "email") {
    const trimmed = (email || "").trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmed)) {
      res.status(400).json({ message: "Введіть коректний email" })
      return
    }
    normalizedEmail = trimmed
    contact_value = trimmed
  } else {
    const trimmed = (phone || "").trim()
    if (!PHONE_REGEX.test(trimmed)) {
      res
        .status(400)
        .json({ message: "Введіть коректний номер у форматі +380XXXXXXXXX" })
      return
    }
    normalizedPhone = trimmed
    contact_value = trimmed
  }

  const productModuleService = req.scope.resolve(Modules.PRODUCT)

  const product = await productModuleService
    .retrieveProduct(product_id, {
      relations: ["variants", "variants.options", "images"],
    })
    .catch(() => null)

  if (!product) {
    res.status(404).json({ message: "Товар не знайдено" })
    return
  }

  let variantTitle: string | null = null
  if (variant_id) {
    const variant = product.variants?.find((v) => v.id === variant_id)
    if (!variant) {
      res.status(404).json({ message: "Варіант товару не знайдено" })
      return
    }
    variantTitle =
      variant.options?.map((o) => o.value).join(" / ") ||
      variant.title ||
      null
  }

  const waitlistService: ProductWaitlistModuleService = req.scope.resolve(
    PRODUCT_WAITLIST_MODULE
  )

  const existing = await waitlistService.findActiveDuplicate({
    product_id,
    variant_id: variant_id || null,
    contact_value,
  })

  if (existing) {
    res.status(409).json({
      message:
        "Ви вже зареєстровані на очікування цього товару. Ми повідомимо вас, як тільки він з'явиться.",
      already_registered: true,
    })
    return
  }

  const entry = await waitlistService.createEntry({
    product_id: product.id,
    product_handle: product.handle!,
    product_title: product.title,
    product_thumbnail: product.thumbnail || null,
    variant_id: variant_id || null,
    variant_title: variantTitle,
    contact_method,
    contact_value,
    email: normalizedEmail,
    phone: normalizedPhone,
  })

  res.status(201).json({ entry })
}
