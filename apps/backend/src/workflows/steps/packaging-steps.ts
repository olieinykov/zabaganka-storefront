import {
  ContainerRegistrationKeys,
  MedusaError,
  QueryContext,
} from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  addAmounts,
  getOfferedPackagingVariants,
  LINE_ITEM_PACKAGING_KEY,
  formatDimensions,
  LineItemPackaging,
  PackagingVariantRecord,
  PRODUCT_PACKAGING_FIELDS,
  readLineItemPackaging,
  toAmount,
  variantImageUrl,
} from "../../lib/packaging"
import { PACKAGING_MODULE } from "../../modules/packaging"
import PackagingModuleService from "../../modules/packaging/service"

// ---------------------------------------------------------------------------
// Packaging and packaging variants (admin)
// ---------------------------------------------------------------------------

export type PackagingInput = {
  title: string
  description?: string | null
  image_url?: string | null
  is_available?: boolean
}

export type PackagingVariantInput = {
  length: number
  width: number
  height: number
  price: number
  image_url?: string | null
  is_available?: boolean
}

function packagingService(container: MedusaContainer): PackagingModuleService {
  return container.resolve(PACKAGING_MODULE)
}

export const createPackagingStep = createStep(
  "create-packaging",
  async (data: PackagingInput, { container }) => {
    const packaging = await packagingService(container).createPackagingOptions(data)
    return new StepResponse(packaging, packaging.id)
  },
  async (id, { container }) => {
    if (id) {
      await packagingService(container).deletePackagingOptions(id)
    }
  }
)

export const updatePackagingStep = createStep(
  "update-packaging",
  async (data: Partial<PackagingInput> & { id: string }, { container }) => {
    const service = packagingService(container)
    const previous = await service.retrievePackagingOption(data.id)
    const packaging = await service.updatePackagingOptions(data)

    return new StepResponse(packaging, {
      id: previous.id,
      title: previous.title,
      description: previous.description,
      image_url: previous.image_url,
      is_available: previous.is_available,
    })
  },
  async (previous, { container }) => {
    if (previous) {
      await packagingService(container).updatePackagingOptions(previous)
    }
  }
)

export const softDeletePackagingStep = createStep(
  "soft-delete-packaging",
  async (id: string, { container }) => {
    // Cascades to the packaging's variants.
    await packagingService(container).softDeletePackagingOptions(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (id) {
      await packagingService(container).restorePackagingOptions(id)
    }
  }
)

export const listPackagingVariantIdsStep = createStep(
  "list-packaging-variant-ids",
  async (input: { packaging_id: string }, { container }) => {
    const variants = await packagingService(container).listPackagingVariants(
      { packaging_id: input.packaging_id },
      { select: ["id"] }
    )
    return new StepResponse(variants.map((variant) => variant.id))
  }
)

async function assertUniqueVariantSize(
  service: PackagingModuleService,
  packagingId: string,
  size: { length: number; width: number; height: number },
  exceptId?: string
) {
  const sameSize = await service.listPackagingVariants(
    {
      packaging_id: packagingId,
      length: size.length,
      width: size.width,
      height: size.height,
    },
    { select: ["id"] }
  )

  if (sameSize.some((variant) => variant.id !== exceptId)) {
    throw new MedusaError(
      MedusaError.Types.DUPLICATE_ERROR,
      `Варіант розміром ${formatDimensions(size)} у цього пакування вже є.`
    )
  }
}

export const createPackagingVariantStep = createStep(
  "create-packaging-variant",
  async (
    data: PackagingVariantInput & { packaging_id: string },
    { container }
  ) => {
    const service = packagingService(container)
    await service.retrievePackagingOption(data.packaging_id)
    await assertUniqueVariantSize(service, data.packaging_id, data)
    const variant = await service.createPackagingVariants(data)
    return new StepResponse(variant, variant.id)
  },
  async (id, { container }) => {
    if (id) {
      await packagingService(container).deletePackagingVariants(id)
    }
  }
)

async function retrieveVariantOfPackaging(
  service: PackagingModuleService,
  id: string,
  packagingId: string
) {
  const variant = await service.retrievePackagingVariant(id)
  if (variant.packaging_id !== packagingId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Packaging variant "${id}" was not found for this packaging`
    )
  }
  return variant
}

export const updatePackagingVariantStep = createStep(
  "update-packaging-variant",
  async (
    input: {
      id: string
      packaging_id: string
      update: Partial<PackagingVariantInput>
    },
    { container }
  ) => {
    const service = packagingService(container)
    const previous = await retrieveVariantOfPackaging(
      service,
      input.id,
      input.packaging_id
    )
    await assertUniqueVariantSize(
      service,
      input.packaging_id,
      {
        length: input.update.length ?? previous.length,
        width: input.update.width ?? previous.width,
        height: input.update.height ?? previous.height,
      },
      input.id
    )
    const variant = await service.updatePackagingVariants({
      id: input.id,
      ...input.update,
    })

    return new StepResponse(variant, {
      id: previous.id,
      length: previous.length,
      width: previous.width,
      height: previous.height,
      price: toAmount(previous.price),
      image_url: previous.image_url,
      is_available: previous.is_available,
    })
  },
  async (previous, { container }) => {
    if (previous) {
      await packagingService(container).updatePackagingVariants(previous)
    }
  }
)

export const softDeletePackagingVariantStep = createStep(
  "soft-delete-packaging-variant",
  async (input: { id: string; packaging_id: string }, { container }) => {
    const service = packagingService(container)
    await retrieveVariantOfPackaging(service, input.id, input.packaging_id)
    await service.softDeletePackagingVariants(input.id)
    return new StepResponse(input.id, input.id)
  },
  async (id, { container }) => {
    if (id) {
      await packagingService(container).restorePackagingVariants(id)
    }
  }
)

export type DefaultPackagingInput = {
  title: string
  description?: string | null
  image_url?: string | null
}

type DefaultPackagingCompensation = {
  created: boolean
  id: string
  previous: Required<DefaultPackagingInput> | null
}

export const upsertDefaultPackagingStep = createStep(
  "upsert-default-packaging",
  async (data: DefaultPackagingInput, { container }) => {
    const service = packagingService(container)
    const [current] = await service.listPackagingDefaults({}, { take: 1 })

    const row = current
      ? await service.updatePackagingDefaults({ id: current.id, ...data })
      : await service.createPackagingDefaults(data)

    const compensation: DefaultPackagingCompensation = current
      ? {
          created: false,
          id: current.id,
          previous: {
            title: current.title,
            description: current.description,
            image_url: current.image_url,
          },
        }
      : { created: true, id: row.id, previous: null }

    return new StepResponse(row, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }

    const service = packagingService(container)
    if (compensation.created) {
      await service.deletePackagingDefaults(compensation.id)
    } else if (compensation.previous) {
      await service.updatePackagingDefaults({
        id: compensation.id,
        ...compensation.previous,
      })
    }
  }
)

export const getProductPackagingStep = createStep(
  "get-product-packaging",
  async (input: { product_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "packaging_variants.id"],
      filters: { id: input.product_id },
    })

    const product = data[0] as
      | {
          id: string
          packaging_variants?: ({ id: string } | null)[] | null
        }
      | undefined

    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id "${input.product_id}" was not found`
      )
    }

    return new StepResponse({
      product_id: product.id,
      variant_ids: (product.packaging_variants ?? [])
        .filter((variant): variant is { id: string } => !!variant)
        .map((variant) => variant.id),
    })
  }
)

export const validatePackagingVariantIdsStep = createStep(
  "validate-packaging-variant-ids",
  async (ids: string[], { container }) => {
    if (!ids.length) {
      return new StepResponse(ids)
    }

    const variants = await packagingService(container).listPackagingVariants(
      { id: ids },
      { select: ["id"] }
    )
    const found = new Set(variants.map((variant) => variant.id))
    const missing = ids.filter((id) => !found.has(id))

    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Packaging variants not found: ${missing.join(", ")}`
      )
    }

    return new StepResponse(ids)
  }
)

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export type PackagingCartItem = {
  id: string
  variant_id?: string | null
  product_title?: string | null
  quantity: number
  metadata?: Record<string, unknown> | null
}

export type PackagingCart = {
  id: string
  region_id?: string | null
  currency_code: string
  customer_id?: string | null
  items?: (PackagingCartItem | null)[] | null
}

export const PACKAGING_CART_FIELDS = [
  "id",
  "region_id",
  "currency_code",
  "customer_id",
  "completed_at",
  "items.id",
  "items.variant_id",
  "items.product_title",
  "items.quantity",
  "items.metadata",
]

export type PackagedLineData = {
  unit_price: number
  compare_at_unit_price: number | null
  metadata: { [LINE_ITEM_PACKAGING_KEY]: LineItemPackaging }
}

type PricedVariant = {
  id: string
  product?: {
    id: string
    title?: string | null
    metadata?: Record<string, unknown> | null
    packaging_variants?: (PackagingVariantRecord | null)[] | null
  } | null
  calculated_price?: {
    calculated_amount?: unknown
    original_amount?: unknown
    calculated_price?: { price_list_type?: string | null } | null
  } | null
}

async function getPricedVariants(
  container: MedusaContainer,
  cart: PackagingCart,
  variantIds: string[]
): Promise<Map<string, PricedVariant>> {
  if (!variantIds.length) {
    return new Map()
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "variants",
    fields: [
      "id",
      "product.id",
      "product.title",
      "product.metadata",
      ...PRODUCT_PACKAGING_FIELDS.map((field) => `product.${field}`),
      "calculated_price.*",
    ],
    filters: { id: variantIds },
    context: {
      calculated_price: QueryContext({
        region_id: cart.region_id,
        currency_code: cart.currency_code,
        ...(cart.customer_id ? { customer_id: cart.customer_id } : {}),
      }),
    },
  })

  return new Map(
    (data as unknown as PricedVariant[]).map((variant) => [variant.id, variant])
  )
}

type PackagedLineResult =
  | { ok: true; data: PackagedLineData }
  | { ok: false; reason: "unavailable" | "no_price" }


function buildPackagedLine(
  variant: PricedVariant | undefined,
  packagingVariantId: string
): PackagedLineResult {
  const option = variant?.product
    ? getOfferedPackagingVariants(variant.product).find(
        (candidate) => candidate.id === packagingVariantId
      )
    : undefined

  if (!option) {
    return { ok: false, reason: "unavailable" }
  }

  const plain = buildPlainLine(variant)
  const packagingPrice = toAmount(option.price)

  if (!plain || !Number.isFinite(packagingPrice) || packagingPrice < 0) {
    return { ok: false, reason: "no_price" }
  }

  return {
    ok: true,
    data: {
      unit_price: addAmounts(plain.unit_price, packagingPrice),
      compare_at_unit_price:
        plain.compare_at_unit_price !== null
          ? addAmounts(plain.compare_at_unit_price, packagingPrice)
          : null,
      metadata: {
        [LINE_ITEM_PACKAGING_KEY]: {
          variant_id: option.id,
          packaging_id: option.packaging.id,
          title: option.packaging.title,
          image_url: variantImageUrl(option),
          length: option.length,
          width: option.width,
          height: option.height,
          unit_price: packagingPrice,
          base_unit_price: plain.unit_price,
        },
      },
    },
  }
}

function buildPlainLine(
  variant: PricedVariant | undefined
): { unit_price: number; compare_at_unit_price: number | null } | null {
  const calculated = variant?.calculated_price
  const unitPrice = toAmount(calculated?.calculated_amount)
  if (!Number.isFinite(unitPrice)) {
    return null
  }

  const originalAmount = toAmount(calculated?.original_amount)
  const isSale =
    calculated?.calculated_price?.price_list_type === "sale" &&
    Number.isFinite(originalAmount) &&
    originalAmount > unitPrice

  return {
    unit_price: unitPrice,
    compare_at_unit_price: isSale ? originalAmount : null,
  }
}

function throwPackagingUnavailable(reason: "unavailable" | "no_price"): never {
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    reason === "unavailable"
      ? "Обране пакування недоступне для цього товару. Оберіть інше або залиште фірмове пакування."
      : "Не вдалося розрахувати ціну товару з пакуванням."
  )
}

function cartItems(cart: PackagingCart): PackagingCartItem[] {
  return (cart.items ?? []).filter(
    (item): item is PackagingCartItem => !!item
  )
}

function itemPackagingId(item: PackagingCartItem): string | null {
  return readLineItemPackaging(item.metadata)?.variant_id ?? null
}


export const resolvePackagedLineStep = createStep(
  "resolve-packaged-line",
  async (
    input: {
      cart: PackagingCart
      variant_id: string
      packaging_variant_id: string
    },
    { container }
  ) => {
    const variants = await getPricedVariants(container, input.cart, [
      input.variant_id,
    ])
    const variant = variants.get(input.variant_id)

    if (!variant) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Variant with id "${input.variant_id}" was not found`
      )
    }

    const line = buildPackagedLine(variant, input.packaging_variant_id)
    if (!line.ok) {
      throwPackagingUnavailable(line.reason)
    }

    const existing = cartItems(input.cart).find(
      (item) =>
        item.variant_id === input.variant_id &&
        itemPackagingId(item) === input.packaging_variant_id
    )

    return new StepResponse({
      line: line.data,
      existing_item: existing
        ? { id: existing.id, quantity: Number(existing.quantity) }
        : null,
    })
  }
)

export type LinePackagingChange =
  | { action: "noop" }
  | {
      action: "update"
      item_id: string
      data: Record<string, unknown>
    }
  | {
      action: "merge"
      remove_item_id: string
      into_item_id: string
      quantity: number
      line: PackagedLineData | null
    }


export const resolveLinePackagingChangeStep = createStep(
  "resolve-line-packaging-change",
  async (
    input: {
      cart: PackagingCart
      item_id: string
      packaging_variant_id: string | null
    },
    { container }
  ) => {
    const items = cartItems(input.cart)
    const item = items.find((candidate) => candidate.id === input.item_id)

    if (!item) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Line item with id "${input.item_id}" was not found in the cart`
      )
    }
    if (!item.variant_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Для цієї позиції не можна змінити пакування."
      )
    }

    const targetId = input.packaging_variant_id
    if (itemPackagingId(item) === targetId) {
      return new StepResponse<LinePackagingChange>({ action: "noop" })
    }

    const variants = await getPricedVariants(container, input.cart, [
      item.variant_id,
    ])
    const variant = variants.get(item.variant_id)

    let line: PackagedLineData | null = null
    if (targetId) {
      const result = buildPackagedLine(variant, targetId)
      if (!result.ok) {
        throwPackagingUnavailable(result.reason)
      }
      line = result.data
    }

    const mergeTarget = items.find(
      (candidate) =>
        candidate.id !== item.id &&
        candidate.variant_id === item.variant_id &&
        itemPackagingId(candidate) === targetId
    )

    if (mergeTarget) {
      return new StepResponse<LinePackagingChange>({
        action: "merge",
        remove_item_id: item.id,
        into_item_id: mergeTarget.id,
        quantity: Number(mergeTarget.quantity) + Number(item.quantity),
        line,
      })
    }

    let data: Record<string, unknown>
    if (line) {
      data = {
        unit_price: line.unit_price,
        compare_at_unit_price: line.compare_at_unit_price,
        is_custom_price: true,
        metadata: line.metadata,
      }
    } else {
      const plain = buildPlainLine(variant)
      if (!plain) {
        throwPackagingUnavailable("no_price")
      }
      data = {
        unit_price: plain.unit_price,
        compare_at_unit_price: plain.compare_at_unit_price,
        is_custom_price: false,
        metadata: { [LINE_ITEM_PACKAGING_KEY]: "" },
      }
    }

    return new StepResponse<LinePackagingChange>({
      action: "update",
      item_id: item.id,
      data,
    })
  }
)

export type CartPackagingSyncResult = {
  updates: {
    id: string
    unit_price: number
    compare_at_unit_price: number | null
    is_custom_price: true
    metadata: PackagedLineData["metadata"]
  }[]
  unavailable: { item_id: string; product_title: string; packaging_title: string }[]
}

export const computeCartPackagingSyncStep = createStep(
  "compute-cart-packaging-sync",
  async (input: { cart: PackagingCart }, { container }) => {
    const packaged = cartItems(input.cart)
      .map((item) => ({ item, packaging: readLineItemPackaging(item.metadata) }))
      .filter(
        (
          entry
        ): entry is { item: PackagingCartItem; packaging: LineItemPackaging } =>
          !!entry.packaging && !!entry.item.variant_id
      )

    const result: CartPackagingSyncResult = { updates: [], unavailable: [] }
    if (!packaged.length) {
      return new StepResponse(result)
    }

    const variants = await getPricedVariants(
      container,
      input.cart,
      Array.from(new Set(packaged.map(({ item }) => item.variant_id as string)))
    )

    for (const { item, packaging } of packaged) {
      const line = buildPackagedLine(
        variants.get(item.variant_id as string),
        packaging.variant_id
      )

      if (!line.ok) {
        result.unavailable.push({
          item_id: item.id,
          product_title: item.product_title ?? "",
          packaging_title: packaging.title,
        })
        continue
      }

      const current = readLineItemPackaging(item.metadata)
      const next = line.data.metadata[LINE_ITEM_PACKAGING_KEY]
      const unchanged =
        current &&
        current.unit_price === next.unit_price &&
        current.base_unit_price === next.base_unit_price &&
        current.title === next.title &&
        current.image_url === next.image_url &&
        current.length === next.length &&
        current.width === next.width &&
        current.height === next.height

      if (!unchanged) {
        result.updates.push({
          id: item.id,
          unit_price: line.data.unit_price,
          compare_at_unit_price: line.data.compare_at_unit_price,
          is_custom_price: true,
          metadata: line.data.metadata,
        })
      }
    }

    return new StepResponse(result)
  }
)
