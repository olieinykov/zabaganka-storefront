import { COUNTRY_CODE } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import React, { useEffect, useRef, useState } from "react"

const ShippingAddress = ({
  customer,
  cart,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const countryCode =
    cart?.shipping_address?.country_code ||
    cart?.region?.countries?.[0]?.iso_2 ||
    COUNTRY_CODE

  const initializedForCartId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (initializedForCartId.current === cart?.id) {
      return
    }
    initializedForCartId.current = cart?.id ?? null

    const address = cart?.shipping_address
    setFormData({
      "shipping_address.first_name":
        address?.first_name || customer?.first_name || "",
      "shipping_address.last_name":
        address?.last_name || customer?.last_name || "",
      "shipping_address.phone": address?.phone || customer?.phone || "",
      email: cart?.email || customer?.email || "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="hidden"
        name="shipping_address.country_code"
        value={countryCode}
      />
      <Input
        label="Ім'я"
        name="shipping_address.first_name"
        autoComplete="given-name"
        value={formData["shipping_address.first_name"]}
        onChange={handleChange}
        required
        data-testid="shipping-first-name-input"
      />
      <Input
        label="Прізвище"
        name="shipping_address.last_name"
        autoComplete="family-name"
        value={formData["shipping_address.last_name"]}
        onChange={handleChange}
        required
        data-testid="shipping-last-name-input"
      />
      <Input
        label="Електронна пошта"
        name="email"
        type="email"
        title="Введіть дійсну адресу електронної пошти."
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        required
        data-testid="shipping-email-input"
      />
      <Input
        label="Телефон"
        name="shipping_address.phone"
        type="tel"
        autoComplete="tel"
        value={formData["shipping_address.phone"]}
        onChange={handleChange}
        data-testid="shipping-phone-input"
      />
    </div>
  )
}

export default ShippingAddress
