import type { DeliveryCarrier } from "@modules/checkout/components/delivery-destination"
import { clx } from "@modules/common/components/ui"

type CarrierLogoProps = {
  carrier: DeliveryCarrier
  className?: string
}

export function NovaPoshtaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="#DA291C"
      className={clx("h-6 w-6 shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 1.5 7.15 6.35h2.4v4.3h4.9V6.35h2.4L12 1.5z" />
      <path d="M12 22.5l4.85-4.85h-2.4v-4.3h-4.9v4.3H7.15L12 22.5z" />
      <path d="M1.5 12l4.85-4.85v9.7L1.5 12z" />
      <path d="M22.5 12l-4.85-4.85v9.7L22.5 12z" />
    </svg>
  )
}

export function UkrposhtaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-4 -4 44 42"
      fill="#FFBE0C"
      className={clx("h-6 w-6 shrink-0", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M35.7289 0C35.7289 0 28.9377 18.9806 26.5564 24.1632C24.175 29.3458 20.1135 34 13.2146 34C5.91639 34 0 28.1285 0 20.8857C1.30727e-05 15.0102 3.89347 10.0373 9.25957 8.3691L12.6923 16.0626C10.2386 16.3213 8.32704 18.3819 8.32703 20.8857C8.32703 23.5645 10.5153 25.7362 13.2146 25.7362C15.9139 25.7362 18.0394 23.5645 18.0394 20.8857C18.0394 19.6281 17.634 18.5161 17.1971 17.5622C16.7604 16.6087 9.40102 0.0129734 9.39526 0H35.7289Z" />
    </svg>
  )
}

export function CarrierLogo({ carrier, className }: CarrierLogoProps) {
  if (carrier === "nova-poshta") {
    return <NovaPoshtaLogo className={className} />
  }

  return <UkrposhtaLogo className={className} />
}
