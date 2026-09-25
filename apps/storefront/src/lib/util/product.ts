import { HttpTypes } from "@medusajs/types";

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
    return product.options?.length === 1 && product.options[0].values?.length === 1;
}

export const isDefaultOption = (
  option: Pick<HttpTypes.StoreProductOption, "title">
): boolean => {
  return (option.title ?? "").trim().toLowerCase() === "default option"
}

export const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
): Record<string, string> | undefined => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export const isOptionValueAvailable = ({
  variants,
  selectedOptions,
  optionId,
  value,
}: {
  variants: HttpTypes.StoreProductVariant[] | undefined | null
  selectedOptions: Record<string, string | undefined>
  optionId: string
  value: string
}): boolean => {
  if (!variants?.length) {
    return true
  }

  const candidate = { ...selectedOptions, [optionId]: value }

  return variants.some((variant) => {
    const variantOptions = optionsAsKeymap(variant.options)
    return Object.entries(candidate).every(([id, val]) => {
      if (!val) return true
      return variantOptions?.[id] === val
    })
  })
}

export const isVariantInStock = (
  variant?: HttpTypes.StoreProductVariant | null
): boolean => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity || 0) > 0
}

export const getDefaultVariant = (
  product: Pick<HttpTypes.StoreProduct, "variants">
): HttpTypes.StoreProductVariant | undefined => {
  const variants = product.variants ?? []
  return variants.find((variant) => isVariantInStock(variant)) ?? variants[0]
}

export const isProductInStock = (product: HttpTypes.StoreProduct): boolean => {
  if (!product.variants || product.variants.length === 0) {
    return true
  }

  return product.variants.some((variant) => isVariantInStock(variant))
}

export const isProductFullyOutOfStock = (
  product: HttpTypes.StoreProduct
): boolean => {
  if (!product.variants || product.variants.length === 0) {
    return false
  }

  return product.variants.every((variant) => !isVariantInStock(variant))
}