"use client"
import { setAddresses } from "@lib/data/cart"
import { CheckCircleSolid, PencilSquareSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { Button, Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

function snapshotForm(form: HTMLFormElement): string {
  const pairs: string[] = []
  for (const [key, value] of new FormData(form).entries()) {
    pairs.push(`${key}=${typeof value === "string" ? value : "[file]"}`)
  }
  return pairs.sort().join("&")
}

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"
  const returnTo = searchParams.get("return_to")
  const isEditMode = !!returnTo

  const handleEdit = () => {
    const currentStep = searchParams.get("step") || "review"
    router.push(
      pathname + `?step=address&return_to=${currentStep}`,
      { scroll: false }
    )
  }

  const handleDiscardChanges = () => {
    if (formRef.current) {
      formRef.current.reset()
    }
    if (!returnTo) {
      return
    }
    router.push(pathname + `?step=${returnTo}`, { scroll: false })
  }

  const [message, formAction] = useActionState(setAddresses, null)

  const formRef = useRef<HTMLFormElement>(null)
  const initialSnapshotRef = useRef<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (isOpen && formRef.current) {
      initialSnapshotRef.current = snapshotForm(formRef.current)
      setIsDirty(false)
    }
  }, [isOpen])

  const handleFormChange = () => {
    if (!formRef.current || initialSnapshotRef.current === null) {
      return
    }
    setIsDirty(snapshotForm(formRef.current) !== initialSnapshotRef.current)
  }

  return (
    <div className="bg-ivory">
      <div className="flex flex-row items-center justify-between mb-6 gap-x-4">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-center"
        >
          Адреса доставки
          {!isOpen && <CheckCircleSolid className="flex-shrink-0" />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex items-center justify-center p-2 sm:p-0"
              data-testid="edit-address-button"
            >
              <span className="hidden sm:inline">Редагувати</span>
              <PencilSquareSolid className="sm:hidden w-5 h-5" />
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form ref={formRef} action={formAction} onChange={handleFormChange}>
          <input type="hidden" name="return_to" value={returnTo || ""} />
          <div className="pb-8">
            <ShippingAddress customer={customer} cart={cart} />
            {isEditMode ? (
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleDiscardChanges}
                  data-testid="discard-address-changes-button"
                >
                  Нічого не змінювати
                </Button>
                <SubmitButton
                  disabled={!isDirty}
                  data-testid="submit-address-button"
                >
                  Зберегти зміни
                </SubmitButton>
              </div>
            ) : (
              <SubmitButton
                className="mt-6"
                data-testid="submit-address-button"
              >
                Перейти до доставки
              </SubmitButton>
            )}
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="flex items-start gap-x-8">
                <div className="flex flex-col md:flex-row items-start gap-y-6 md:gap-y-0 gap-x-4 w-full">
                  <div
                    className="flex flex-col w-full md:w-1/3"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Отримувач
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                  </div>

                  <div
                    className="flex flex-col w-full md:w-1/3"
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      Контакти
                    </Text>
                    {cart.shipping_address.phone && (
                      <Text className="txt-medium text-ui-fg-subtle">
                        {cart.shipping_address.phone}
                      </Text>
                    )}
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.email}
                    </Text>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses