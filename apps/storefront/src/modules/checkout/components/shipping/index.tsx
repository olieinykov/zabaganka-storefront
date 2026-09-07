"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setCartDeliveryMetadata, setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import {
  estimatesExceedPostomat,
  fetchPostomatLimits,
  type PostomatLimits,
} from "@lib/util/postomat-capacity"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
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

/** Renders the Nova Poshta / Ukrposhta destination (or courier comment)
 *  saved on a shipping method's `data`, for display in the collapsed
 *  "Доставка" summary once this step is completed. */
function formatDeliveryDestination(
  data:
    | {
        type?: CarrierOptionData["type"]
        city_name?: string
        warehouse_name?: string
        comment?: string
      }
    | undefined
) {
  if (!data?.type) {
    return null
  }

  if (data.type === "courier") {
    const cityPart = data.city_name ? `Кур'єром у м. ${data.city_name}` : null
    const commentPart = data.comment ? `Коментар для кур'єра: ${data.comment}` : null
    return [cityPart, commentPart].filter(Boolean).join(". ") || null
  }

  // "warehouse" | "postomat"
  if (data.city_name && data.warehouse_name) {
    return `${data.city_name}, ${data.warehouse_name}`
  }

  return data.city_name || null
}


const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

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

  // When the customer selects a Nova Poshta / Ukrposhta shipping option that
  // requires a destination (warehouse, postomat, or a courier comment), we
  // hold off calling the shipping-method API until a valid destination has
  // been chosen in <DeliveryDestination />.
  const [destinationOption, setDestinationOption] =
    useState<HttpTypes.StoreCartShippingOption | null>(null)
  // Tracks whether the currently selected Nova Poshta / Ukrposhta
  // destination is a *complete, committed* selection. `<DeliveryDestination
  // />` calls `onChange(null)` any time the city/warehouse fields stop
  // forming a valid selection (e.g. the customer edits the city text after
  // already picking a warehouse) — this flag is what actually blocks moving
  // on to the next step in that case, since `cart.shipping_methods` on its
  // own still reflects the *last successfully saved* method and wouldn't
  // otherwise change just because the on-screen fields became invalid.
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

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  // Any invocation of a Server Action anywhere on this page (including
  // `calculatePriceForShippingOption` below) makes Next.js re-render the
  // whole route on the server, which re-fetches `availableShippingMethods`
  // and hands this component a *new array reference* with the same
  // underlying data. If this effect depended on that reference directly, it
  // would fire again, call the Server Action again, trigger another
  // re-render, and loop forever — which also kept stomping on whatever the
  // customer was typing into the address form elsewhere on the page (that
  // component re-syncs from the `cart` prop on every reference change too).
  // Depending on a content-based key instead means the effect only re-runs
  // when the actual set of options/prices could have changed.
  const shippingMethodsKey = useMemo(
    () =>
      (availableShippingMethods ?? [])
        .map((sm) => `${sm.id}:${sm.price_type}`)
        .sort()
        .join(","),
    [availableShippingMethods]
  )

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }

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
    router.push(pathname + "?step=delivery", { scroll: false })
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

  /**
   * Called by <DeliveryDestination /> once the customer has picked a valid
   * destination (city + warehouse/postomat, or a courier comment). Submits
   * the shipping method with that data (validated by the fulfillment
   * provider's `validateFulfillmentData`), and mirrors it onto the cart's
   * `metadata.delivery` so it's easy to read from the cart/order directly.
   */
  const handleDestinationChange = async (value: DeliveryDestinationValue | null) => {
    if (!destinationOption) {
      return
    }

    if (!value) {
      // The selection is currently incomplete (or was edited after being
      // valid) — don't call the API, and make sure the customer can't
      // proceed until it's valid again.
      setIsDestinationConfirmed(false)
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
      await setCartDeliveryMetadata(cart.id, value)
      setIsDestinationConfirmed(true)
    } catch (err) {
      setIsDestinationConfirmed(false)
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-ivory">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Доставка
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
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
                      <span className="justify-self-end text-ui-fg-base">
                        -
                      </span>
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
                      // Only the previously *saved* method for this exact
                      // option counts as confirmed; a freshly picked radio
                      // starts out unconfirmed until <DeliveryDestination />
                      // reports a complete selection.
                      setIsDestinationConfirmed(
                        cart.shipping_methods?.at(-1)?.shipping_option_id ===
                          option.id
                      )
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

                    const isDisabled =
                      isTooBigForPostomat ||
                      (option.price_type === "calculated" &&
                        !isLoadingPrices &&
                        typeof calculatedPricesMap[option.id] !== "number")

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
                          "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
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
                          <span className="text-base-regular">
                            {option.name}
                            {isTooBigForPostomat && (
                              <span className="block text-ui-fg-muted txt-small">
                                Замовлення не поміщається у поштомат
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="justify-self-end text-ui-fg-base">
                          {isTooBigForPostomat ? (
                            "-"
                          ) : option.price_type === "flat" ? (
                            convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })
                          ) : calculatedPricesMap[option.id] ? (
                            convertToLocale({
                              amount: calculatedPricesMap[option.id],
                              currency_code: cart?.currency_code,
                            })
                          ) : isLoadingPrices ? (
                            <Loader />
                          ) : (
                            "-"
                          )}
                        </span>
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

                    return (
                      <DeliveryDestination
                        key={destinationOption.id}
                        carrier={optionData.carrier!}
                        type={optionData.type!}
                        onChange={handleDestinationChange}
                        initialValue={
                          hasCommittedMethod ? lastShippingMethodData : undefined
                        }
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
                          <span className="justify-self-end text-ui-fg-base">
                            {convertToLocale({
                              amount: option.amount!,
                              currency_code: cart?.currency_code,
                            })}
                          </span>
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
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular flex flex-col gap-y-4 small:flex-row small:gap-x-6">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Метод
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount!,
                    currency_code: cart?.currency_code,
                  })}
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
                <div className="flex flex-col w-2/3">
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
