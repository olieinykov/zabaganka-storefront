"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import {
  estimatesExceedPostomat,
  fetchPostomatLimits,
  type PostomatLimits,
} from "@lib/util/postomat-capacity"
import { formatDeliveryDestination } from "@lib/util/format-delivery-destination"
import { CheckCircleSolid, PencilSquareSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CarrierLogo } from "@modules/checkout/components/carrier-logos"
import DeliveryDestination, {
  DeliveryDestinationValue,
} from "@modules/checkout/components/delivery-destination"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

/** Shape stored in a shipping option's `data` by our custom fulfillment
 *  providers' `getFulfillmentOptions` (see backend `nova-poshta-fulfillment`
 *  / `ukrposhta-fulfillment` modules). */
type CarrierOptionData = {
  carrier?: "nova-poshta" | "ukrposhta"
  type?: "warehouse" | "postomat" | "courier"
}

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

// formatDeliveryDestination now lives in @lib/util/format-delivery-destination
// so the checkout delivery step and the order confirmation page render the
// Nova Poshta / Ukrposhta destination the exact same way.

function isSameAsSavedMethod(
  cart: HttpTypes.StoreCart,
  shippingMethodId: string,
  data: Record<string, unknown> | undefined
): boolean {
  const savedMethod = cart.shipping_methods?.at(-1)
  if (savedMethod?.shipping_option_id !== shippingMethodId) {
    return false
  }

  if (!data) {
    return true
  }

  const saved = (savedMethod?.data ?? {}) as Record<string, unknown>
  return (
    (data.city_ref ?? undefined) === (saved.city_ref ?? undefined) &&
    (data.warehouse_ref ?? undefined) === (saved.warehouse_ref ?? undefined) &&
    (data.comment ?? undefined) === (saved.comment ?? undefined)
  )
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const [pendingSave, setPendingSave] = useState<{
    shippingMethodId: string
    variant: "shipping" | "pickup"
    data?: Record<string, unknown>
  } | null>(null)

  // "Поштомат" needs to be greyed out up front if the order's estimated
  // package doesn't fit a standard cell — see
  // src/lib/util/postomat-capacity.ts. The backend enforces this
  // authoritatively on submit either way; this is just so the customer
  // doesn't pick it and then hit an error.
  const [postomatLimits, setPostomatLimits] = useState<PostomatLimits | null>(null)
  useEffect(() => {
    fetchPostomatLimits()
      .then(setPostomatLimits)
      .catch(() => setPostomatLimits(null))
  }, [])
  const exceedsPostomat = postomatLimits
    ? estimatesExceedPostomat(cart.items, postomatLimits)
    : false

  const [destinationOption, setDestinationOption] =
    useState<HttpTypes.StoreCartShippingOption | null>(null)
  const [isDestinationConfirmed, setIsDestinationConfirmed] = useState(true)
  const lastShippingMethodData = cart.shipping_methods?.at(-1)?.data as
    | (CarrierOptionData & {
        city_ref?: string
        city_name?: string
        warehouse_ref?: string
        warehouse_name?: string
        comment?: string
      })
    | undefined

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"
  const returnTo = searchParams.get("return_to")
  const isEditMode = !!returnTo

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  const shippingMethodsKey = useMemo(
    () =>
      (availableShippingMethods ?? [])
        .map((sm) => sm.id)
        .sort()
        .join(","),
    [availableShippingMethods]
  )

  useEffect(() => {
    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }

    const currentOption = _shippingMethods?.find((m) => m.id === shippingMethodId)
    const currentOptionData = currentOption?.data as CarrierOptionData | undefined
    if (
      currentOption &&
      (currentOptionData?.carrier === "nova-poshta" ||
        currentOptionData?.carrier === "ukrposhta") &&
      currentOptionData?.type
    ) {
      setDestinationOption(currentOption)
      // This mirrors a method that's already saved on the cart, so treat it
      // as confirmed until the customer actually edits the fields.
      setIsDestinationConfirmed(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethodsKey])

  const handleEdit = () => {
    const currentStep = searchParams.get("step") || "review"
    router.push(
      pathname + `?step=delivery&return_to=${currentStep}`,
      { scroll: false }
    )
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup",
    data?: Record<string, unknown>
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    if (isEditMode) {
      setShippingMethodId(id)
      setPendingSave(
        isSameAsSavedMethod(cart, id, data)
          ? null
          : { shippingMethodId: id, variant, data }
      )
      return
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id, data })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleDestinationChange = async (value: DeliveryDestinationValue | null) => {
    if (!destinationOption) {
      return
    }

    if (!value) {
      setIsDestinationConfirmed(false)
      if (isEditMode) {
        setPendingSave((prev) =>
          prev?.shippingMethodId === destinationOption.id ? null : prev
        )
      }
      return
    }

    if (isEditMode) {
      setError(null)
      setIsDestinationConfirmed(true)
      setPendingSave(
        isSameAsSavedMethod(
          cart,
          destinationOption.id,
          value as unknown as Record<string, unknown>
        )
          ? null
          : {
              shippingMethodId: destinationOption.id,
              variant: "shipping",
              data: value,
            }
      )
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: destinationOption.id,
        data: value,
      })
      setIsDestinationConfirmed(true)
    } catch (err) {
      setIsDestinationConfirmed(false)
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    if (!pendingSave || !returnTo) {
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      await setShippingMethod({
        cartId: cart.id,
        shippingMethodId: pendingSave.shippingMethodId,
        data: pendingSave.data,
      })
      setPendingSave(null)
      router.push(pathname + `?step=${returnTo}`, { scroll: false })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscardChanges = () => {
    if (!returnTo) {
      return
    }

    const savedId = cart.shipping_methods?.at(-1)?.shipping_option_id ?? null
    const savedOption = _shippingMethods?.find((m) => m.id === savedId)
    const savedOptionData = savedOption?.data as CarrierOptionData | undefined

    setError(null)
    setPendingSave(null)
    setShippingMethodId(savedId)

    if (
      savedOption &&
      (savedOptionData?.carrier === "nova-poshta" ||
        savedOptionData?.carrier === "ukrposhta") &&
      savedOptionData?.type
    ) {
      setDestinationOption(savedOption)
    } else {
      setDestinationOption(null)
    }
    setIsDestinationConfirmed(true)

    setShowPickupOptions(
      _pickupMethods?.find((m) => m.id === savedId)
        ? PICKUP_OPTION_ON
        : PICKUP_OPTION_OFF
    )

    router.push(pathname + `?step=${returnTo}`, { scroll: false })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-ivory">
      <div className="flex flex-row items-center justify-between mb-6 gap-x-4">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-center",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Доставка
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid className="flex-shrink-0" />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex items-center justify-center p-2 sm:p-0"
                data-testid="edit-delivery-button"
              >
                <span className="hidden sm:inline">Редагувати</span>
                <PencilSquareSolid className="sm:hidden w-5 h-5" />
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Спосіб доставки
              </span>
              <span className="mb-4 text-ui-fg-muted txt-medium">
                Як ви бажаєте отримати своє замовлення
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                {hasPickupOptions && (
                  <RadioGroup
                    value={showPickupOptions}
                    onChange={(_value) => {
                      const id = _pickupMethods.find(
                        (option) => !option.insufficient_inventory
                      )?.id

                      if (id) {
                        handleSetShippingMethod(id, "pickup")
                      }
                    }}
                  >
                    <Radio
                      value={PICKUP_OPTION_ON}
                      data-testid="delivery-option-radio"
                      className={clx(
                        "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                        {
                          "border-ui-border-interactive":
                            showPickupOptions === PICKUP_OPTION_ON,
                        }
                      )}
                    >
                      <div className="flex items-center gap-x-4">
                        <MedusaRadio
                          checked={showPickupOptions === PICKUP_OPTION_ON}
                        />
                        <span className="text-base-regular">
                          Заберіть своє замовлення
                        </span>
                      </div>
                    </Radio>
                  </RadioGroup>
                )}
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (!v) {
                      return
                    }

                    const option = _shippingMethods?.find((o) => o.id === v)
                    const optionData = option?.data as
                      | CarrierOptionData
                      | undefined

                    if (
                      option &&
                      (optionData?.carrier === "nova-poshta" ||
                        optionData?.carrier === "ukrposhta") &&
                      optionData?.type
                    ) {
                      // Don't call the API yet — wait for a valid destination
                      // (city + warehouse/postomat, or courier comment).
                      setError(null)
                      setShippingMethodId(v)
                      setDestinationOption(option)
                      // Always start unconfirmed on an interactive change —
                      // even when switching back to the option that's
                      // currently saved on the cart. Previously this compared
                      // against the saved cart to decide, which meant
                      // switching away to a different Nova Poshta option and
                      // back (without ever filling that other option in)
                      // could re-enable "Продовжити" instantly, before
                      // <DeliveryDestination /> below had actually
                      // remounted and re-confirmed anything for this render.
                      // <DeliveryDestination />'s own onChange (fired right
                      // after it mounts, pre-filled from the saved data —
                      // see `initialValue` below) is what flips this back to
                      // `true`, so the button only unlocks once that real
                      // round trip has happened.
                      setIsDestinationConfirmed(false)
                      return
                    }

                    setDestinationOption(null)
                    return handleSetShippingMethod(v, "shipping")
                  }}
                >
                  {_shippingMethods?.map((option) => {
                    const optionData = option.data as CarrierOptionData | undefined
                    const isPostomat =
                      optionData?.carrier === "nova-poshta" && optionData?.type === "postomat"
                    const isTooBigForPostomat = isPostomat && exceedsPostomat

                    const isDisabled = isTooBigForPostomat
                    const showCarrierLogo =
                      optionData?.carrier === "nova-poshta" ||
                      optionData?.carrier === "ukrposhta"

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        title={
                          isTooBigForPostomat
                            ? "Замовлення завелике для поштомата — оберіть відділення або кур'єра"
                            : undefined
                        }
                        className={clx(
                          "flex items-center text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                          {
                            "border-ui-border-interactive":
                              option.id === shippingMethodId,
                            "hover:shadow-brders-none cursor-not-allowed opacity-50":
                              isDisabled,
                          }
                        )}
                      >
                        <div className="flex items-center gap-x-4">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          {showCarrierLogo && optionData?.carrier ? (
                            <CarrierLogo carrier={optionData.carrier} />
                          ) : null}
                          <span className="text-base-regular">
                            {option.name}
                            {isTooBigForPostomat && (
                              <span className="block text-ui-fg-muted txt-small">
                                Замовлення не поміщається у поштомат
                              </span>
                            )}
                          </span>
                        </div>
                      </Radio>
                    )
                  })}
                </RadioGroup>
                {destinationOption &&
                  shippingMethodId === destinationOption.id &&
                  (() => {
                    const optionData = destinationOption.data as CarrierOptionData
                    const hasCommittedMethod =
                      cart.shipping_methods?.at(-1)?.shipping_option_id ===
                      destinationOption.id

                    const initialValue =
                      pendingSave?.shippingMethodId === destinationOption.id
                        ? (pendingSave.data as
                            | Partial<DeliveryDestinationValue>
                            | undefined)
                        : hasCommittedMethod
                        ? lastShippingMethodData
                        : undefined

                    return (
                      <DeliveryDestination
                        key={destinationOption.id}
                        carrier={optionData.carrier!}
                        type={optionData.type!}
                        onChange={handleDestinationChange}
                        initialValue={initialValue}
                      />
                    )
                  })()}
              </div>
            </div>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="grid">
              <div className="flex flex-col">
                <span className="font-medium txt-medium text-ui-fg-base">
                  Склад
                </span>
                <span className="mb-4 text-ui-fg-muted txt-medium">
                  Оберіть склад поруч із вами
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <div className="pb-8 md:pt-0 pt-2">
                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "pickup")
                      }
                    }}
                  >
                    {_pickupMethods?.map((option) => {
                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          disabled={option.insufficient_inventory}
                          data-testid="delivery-option-radio"
                          className={clx(
                            "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                            {
                              "border-ui-border-interactive":
                                option.id === shippingMethodId,
                              "hover:shadow-brders-none cursor-not-allowed":
                                option.insufficient_inventory,
                            }
                          )}
                        >
                          <div className="flex items-start gap-x-4">
                            <MedusaRadio
                              checked={option.id === shippingMethodId}
                            />
                            <div className="flex flex-col">
                              <span className="text-base-regular">
                                {option.name}
                              </span>
                              <span className="text-base-regular text-ui-fg-muted">
                                {formatAddress(
                                  (option as unknown as { service_zone?: { fulfillment_set?: { location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.location
                                    ?.address as HttpTypes.StoreCartAddress
                                )}
                              </span>
                            </div>
                          </div>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            {isEditMode ? (
              <div className="flex flex-col sm:flex-row gap-3 mt">
                <Button
                  size="large"
                  variant="secondary"
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={isLoading}
                  data-testid="discard-delivery-changes-button"
                >
                  Нічого не змінювати
                </Button>
                <Button
                  size="large"
                  type="button"
                  onClick={handleSaveChanges}
                  isLoading={isLoading}
                  disabled={
                    isLoading ||
                    !pendingSave ||
                    (!!destinationOption &&
                      shippingMethodId === destinationOption.id &&
                      !isDestinationConfirmed)
                  }
                  data-testid="save-delivery-changes-button"
                >
                  Зберегти зміни
                </Button>
              </div>
            ) : (
              <Button
                size="large"
                className="mt"
                onClick={handleSubmit}
                isLoading={isLoading}
                disabled={
                  !cart.shipping_methods?.[0] ||
                  cart.shipping_methods.at(-1)?.shipping_option_id !==
                    shippingMethodId ||
                  (!!destinationOption &&
                    shippingMethodId === destinationOption.id &&
                    !isDestinationConfirmed)
                }
                data-testid="submit-delivery-option-button"
              >
                Перейти до оплати
              </Button>
            )}
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular flex flex-col md:flex-row gap-y-6 md:gap-y-0 gap-x-4 md:gap-x-8 w-full">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-full md:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Метод
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {cart.shipping_methods!.at(-1)!.name}
                </Text>
              </div>
            )}
            {(() => {
              const destinationText =
                formatDeliveryDestination(lastShippingMethodData)

              if (!destinationText) {
                return null
              }

              return (
                <div className="flex flex-col w-full md:w-2/3">
                  <Text className="txt-medium-plus text-ui-fg-base mb-1">
                    Адреса доставки
                  </Text>
                  <Text className="txt-medium text-ui-fg-subtle">
                    {destinationText}
                  </Text>
                </div>
              )
            })()}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping