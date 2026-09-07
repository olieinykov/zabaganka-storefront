"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Text } from "@modules/common/components/ui"
import {
  DeliveryCity,
  DeliveryWarehouse,
  searchNovaPoshtaCities,
  searchNovaPoshtaWarehouses,
  searchUkrposhtaCities,
  searchUkrposhtaWarehouses,
} from "@lib/data/delivery"

export type DeliveryCarrier = "nova-poshta" | "ukrposhta"
export type DeliveryType = "warehouse" | "postomat" | "courier"

export type DeliveryDestinationValue = {
  carrier: DeliveryCarrier
  type: DeliveryType
  city_ref?: string
  city_name?: string
  warehouse_ref?: string
  warehouse_name?: string
  comment?: string
}

type Props = {
  carrier: DeliveryCarrier
  type: DeliveryType
  /** Called with `null` while the selection is incomplete, and with the full
   *  value as soon as it becomes valid (city + warehouse, or just a comment
   *  for courier delivery). */
  onChange: (value: DeliveryDestinationValue | null) => void
  initialValue?: Partial<DeliveryDestinationValue>
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

/**
 * Renders a city + warehouse/postomat autocomplete (for `type: "warehouse" | "postomat"`)
 * or a simple courier-comment field (for `type: "courier"`), backed by the
 * `/store/delivery/nova-poshta/*` and `/store/delivery/ukrposhta/*` proxy
 * endpoints on the Medusa backend.
 */
const DeliveryDestination: React.FC<Props> = ({
  carrier,
  type,
  onChange,
  initialValue,
}) => {
  const [cityQuery, setCityQuery] = useState(initialValue?.city_name || "")
  const [cityResults, setCityResults] = useState<DeliveryCity[]>([])
  const [selectedCity, setSelectedCity] = useState<DeliveryCity | null>(
    initialValue?.city_ref
      ? { ref: initialValue.city_ref, name: initialValue.city_name || "" }
      : null
  )
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [cityLoading, setCityLoading] = useState(false)

  const [warehouseQuery, setWarehouseQuery] = useState(
    initialValue?.warehouse_name || ""
  )
  const [warehouseResults, setWarehouseResults] = useState<
    DeliveryWarehouse[]
  >([])
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<DeliveryWarehouse | null>(
      initialValue?.warehouse_ref
        ? {
            ref: initialValue.warehouse_ref,
            name: initialValue.warehouse_name || "",
            cityRef: initialValue.city_ref || "",
          }
        : null
    )
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false)
  const [warehouseLoading, setWarehouseLoading] = useState(false)

  const [comment, setComment] = useState(initialValue?.comment || "")

  const debouncedCityQuery = useDebouncedValue(cityQuery, 350)
  const debouncedWarehouseQuery = useDebouncedValue(warehouseQuery, 300)
  const debouncedComment = useDebouncedValue(comment, 600)

  const searchCities = useMemo(
    () => (carrier === "nova-poshta" ? searchNovaPoshtaCities : searchUkrposhtaCities),
    [carrier]
  )
  const searchWarehouses = useMemo(
    () =>
      carrier === "nova-poshta"
        ? (cityRef: string, q?: string) =>
            searchNovaPoshtaWarehouses(
              cityRef,
              q,
              type === "postomat" ? "postomat" : "warehouse"
            )
        : searchUkrposhtaWarehouses,
    [carrier, type]
  )

  // City search — also required for courier now: Nova Poshta's own price
  // calculation (InternetDocument.getDocumentPrice) needs a real
  // `CityRecipient` Ref for the *destination* city, not the free-text city
  // typed into the shipping address form. See
  // `src/modules/nova-poshta-fulfillment/service.ts` `calculatePrice` on
  // the backend for how this Ref is used.
  useEffect(() => {
    if (selectedCity && debouncedCityQuery === selectedCity.name) return
    if (debouncedCityQuery.trim().length < 2) {
      setCityResults([])
      return
    }

    let cancelled = false
    setCityLoading(true)
    searchCities(debouncedCityQuery)
      .then((results) => {
        if (!cancelled) setCityResults(results)
      })
      .finally(() => {
        if (!cancelled) setCityLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCityQuery])

  // Warehouse search (depends on selected city)
  useEffect(() => {
    if (type === "courier" || !selectedCity) return
    if (selectedWarehouse && debouncedWarehouseQuery === selectedWarehouse.name)
      return

    let cancelled = false
    setWarehouseLoading(true)
    searchWarehouses(selectedCity.ref, debouncedWarehouseQuery || undefined)
      .then((results) => {
        if (!cancelled) setWarehouseResults(results)
      })
      .finally(() => {
        if (!cancelled) setWarehouseLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, debouncedWarehouseQuery, type])

  // Propagate a valid selection up to the parent
  useEffect(() => {
    if (type === "courier") {
      if (selectedCity) {
        onChange({
          carrier,
          type,
          city_ref: selectedCity.ref,
          city_name: selectedCity.name,
          comment: debouncedComment || undefined,
        })
      } else {
        onChange(null)
      }
      return
    }

    if (selectedCity && selectedWarehouse) {
      onChange({
        carrier,
        type,
        city_ref: selectedCity.ref,
        city_name: selectedCity.name,
        warehouse_ref: selectedWarehouse.ref,
        warehouse_name: selectedWarehouse.name,
      })
    } else {
      onChange(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedWarehouse, debouncedComment, carrier, type])

  const cityBoxRef = useRef<HTMLDivElement>(null)
  const warehouseBoxRef = useRef<HTMLDivElement>(null)

  const cityAutocomplete = (
    <div className="relative" ref={cityBoxRef}>
      <label className="txt-compact-small-plus text-ui-fg-subtle mb-1 block">
        Місто<span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        className="w-full rounded-md border border-ui-border-base px-3 py-2 txt-compact-medium focus:outline-none focus:shadow-borders-interactive-with-active"
        placeholder="Почніть вводити назву міста"
        value={cityQuery}
        onChange={(e) => {
          setCityQuery(e.target.value)
          setSelectedCity(null)
          setSelectedWarehouse(null)
          setWarehouseQuery("")
          setCityDropdownOpen(true)
        }}
        onFocus={() => setCityDropdownOpen(true)}
        onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
        data-testid="delivery-city-input"
      />
      {cityDropdownOpen && (cityLoading || cityResults.length > 0) && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-ui-border-base bg-white shadow-elevation-flyout">
          {cityLoading && (
            <li className="px-3 py-2 txt-compact-small text-ui-fg-subtle">
              Пошук…
            </li>
          )}
          {!cityLoading &&
            cityResults.map((city) => (
              <li
                key={city.ref}
                className="px-3 py-2 txt-compact-small cursor-pointer hover:bg-ui-bg-subtle"
                onMouseDown={() => {
                  setSelectedCity(city)
                  setCityQuery(city.name)
                  setCityDropdownOpen(false)
                  setSelectedWarehouse(null)
                  setWarehouseQuery("")
                }}
                data-testid="delivery-city-option"
              >
                {city.name}
                {city.area ? (
                  <span className="text-ui-fg-subtle"> — {city.area}</span>
                ) : null}
              </li>
            ))}
        </ul>
      )}
    </div>
  )

  if (type === "courier") {
    return (
      <div
        className="mt-4 grid grid-cols-1 gap-4"
        data-testid="delivery-destination-courier"
      >
        {/* Nova Poshta needs a real destination city Ref to price a courier
            delivery correctly — the free-text city typed into the shipping
            address form isn't one, so it's selected here the same way as
            for warehouse/postomat delivery. */}
        {cityAutocomplete}
        <div>
          <label className="txt-compact-small-plus text-ui-fg-subtle mb-1 block">
            Коментар для кур&apos;єра (під&apos;їзд, поверх, домофон)
          </label>
          <textarea
            className="w-full rounded-md border border-ui-border-base px-3 py-2 txt-compact-medium focus:outline-none focus:shadow-borders-interactive-with-active"
            rows={2}
            placeholder="Необов'язково"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            data-testid="delivery-courier-comment"
          />
        </div>
        {!selectedCity ? (
          <Text className="txt-compact-small text-ui-fg-subtle">
            Оберіть місто, щоб продовжити оформлення замовлення.
          </Text>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* City autocomplete */}
      {cityAutocomplete}

      {/* Warehouse / postomat autocomplete */}
      <div className="relative" ref={warehouseBoxRef}>
        <label className="txt-compact-small-plus text-ui-fg-subtle mb-1 block">
          {type === "postomat" ? "Поштомат" : "Відділення"}
          <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-ui-border-base px-3 py-2 txt-compact-medium disabled:bg-ui-bg-disabled disabled:cursor-not-allowed focus:outline-none focus:shadow-borders-interactive-with-active"
          placeholder={
            selectedCity
              ? "Пошук за номером або адресою"
              : "Спочатку оберіть місто"
          }
          value={warehouseQuery}
          disabled={!selectedCity}
          onChange={(e) => {
            setWarehouseQuery(e.target.value)
            setSelectedWarehouse(null)
            setWarehouseDropdownOpen(true)
          }}
          onFocus={() => setWarehouseDropdownOpen(true)}
          onBlur={() => setTimeout(() => setWarehouseDropdownOpen(false), 150)}
          data-testid="delivery-warehouse-input"
        />
        {warehouseDropdownOpen &&
          (warehouseLoading || warehouseResults.length > 0) && (
            <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-ui-border-base bg-white shadow-elevation-flyout">
              {warehouseLoading && (
                <li className="px-3 py-2 txt-compact-small text-ui-fg-subtle">
                  Пошук…
                </li>
              )}
              {!warehouseLoading &&
                warehouseResults.map((wh) => (
                  <li
                    key={wh.ref}
                    className="px-3 py-2 txt-compact-small cursor-pointer hover:bg-ui-bg-subtle"
                    onMouseDown={() => {
                      setSelectedWarehouse(wh)
                      setWarehouseQuery(wh.name)
                      setWarehouseDropdownOpen(false)
                    }}
                    data-testid="delivery-warehouse-option"
                  >
                    {wh.name}
                    {wh.shortAddress ? (
                      <span className="text-ui-fg-subtle">
                        {" "}
                        — {wh.shortAddress}
                      </span>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
      </div>

      {!selectedCity || !selectedWarehouse ? (
        <Text className="md:col-span-2 txt-compact-small text-ui-fg-subtle">
          Оберіть місто та {type === "postomat" ? "поштомат" : "відділення"},
          щоб продовжити оформлення замовлення.
        </Text>
      ) : null}
    </div>
  )
}

export default DeliveryDestination
