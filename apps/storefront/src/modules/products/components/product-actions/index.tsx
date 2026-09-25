"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { COUNTRY_CODE } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import { useToast } from "@modules/common/components/toast"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import {
  getDefaultVariant,
  isVariantInStock,
  isDefaultOption,
  optionsAsKeymap,
} from "@lib/util/product"
import NotifyMeModal from "@modules/products/components/notify-me-modal"
import { isEqual } from "lodash"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  initialVariantId?: string
}

export default function ProductActions({
  product,
  disabled,
  initialVariantId,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const getInitialOptions = () => {
    const initialVariant =
      (initialVariantId &&
        product.variants?.find((v) => v.id === initialVariantId)) ||
      getDefaultVariant(product)

    return (initialVariant && optionsAsKeymap(initialVariant.options)) ?? {}
  }

  const [options, setOptions] =
    useState<Record<string, string | undefined>>(getInitialOptions)
  const [optionsProductId, setOptionsProductId] = useState(product.id)
  const [isAdding, setIsAdding] = useState(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const countryCode = COUNTRY_CODE

  if (optionsProductId !== product.id) {
    setOptionsProductId(product.id)
    setOptions(getInitialOptions())
  }

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string | undefined) => {
    setOptions((prev) => {
      if (value === undefined) {
        const next = { ...prev }
        delete next[optionId]
        return next
      }

      return {
        ...prev,
        [optionId]: value,
      }
    })
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    if ((product.variants?.length ?? 0) <= 1) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString(), { scroll: false })
  }, [selectedVariant, isValidVariant, product.variants])

  const inStock = useMemo(() => {
    return isVariantInStock(selectedVariant)
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      showToast("Товар додано до кошика", { description: product.title })
    } catch (error) {
      showToast("Не вдалося додати товар", {
        description: "Спробуйте ще раз трохи пізніше.",
        variant: "error",
      })
    }

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 ? (
            <div className="flex flex-col gap-y-4">
              {(product.options || [])
                .filter((option) => !isDefaultOption(option))
                .map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                      variants={product.variants}
                      selectedOptions={options}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          ) : (
            (() => {
              const realOptions = (product.options || []).filter(
                (option) => !isDefaultOption(option)
              )

              return (
                !!realOptions.length && (
                  <div className="flex flex-col gap-y-1.5">
                    {realOptions.map((option) => {
                      const value = selectedVariant
                        ? optionsAsKeymap(selectedVariant.options)?.[option.id]
                        : option.values?.[0]?.value

                      if (!value) return null

                      return (
                        <div
                          key={option.id}
                          className="flex items-center gap-x-2 text-sm"
                        >
                          <span className="text-ui-fg-subtle">{option.title}:</span>
                          <span className="text-ui-fg-base font-medium">{value}</span>
                        </div>
                      )
                    })}
                    <Divider />
                  </div>
                )
              )
            })()
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {selectedVariant && isValidVariant && !inStock ? (
          <Button
            type="button"
            onClick={() => setIsNotifyModalOpen(true)}
            variant="secondary"
            className="w-full h-10"
            data-testid="notify-me-button"
          >
            Повідомити, коли з'явиться
          </Button>
        ) : (
          <Button
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className="w-full h-10"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {!selectedVariant || !isValidVariant
              ? "Оберіть варіант товару"
              : "Додати до кошика"}
          </Button>
        )}
        <NotifyMeModal
          productId={product.id}
          variantId={selectedVariant?.id}
          isOpen={isNotifyModalOpen}
          onClose={() => setIsNotifyModalOpen(false)}
        />
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          onNotifyMe={() => setIsNotifyModalOpen(true)}
        />
      </div>
    </>
  )
}