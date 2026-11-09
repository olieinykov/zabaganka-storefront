"use client"

import { convertToLocale } from "@lib/util/money"
import {
  DefaultPackaging,
  formatDimensions,
  PackagingOption,
} from "@lib/util/packaging"
import Modal from "@modules/common/components/modal"
import { clx } from "@modules/common/components/ui"
import CheckIcon from "@modules/common/icons/check"
import PackageIcon from "@modules/common/icons/package"
import X from "@modules/common/icons/x"
import { DialogTitle } from "@headlessui/react"

type PackagingModalProps = {
  isOpen: boolean
  close: () => void
  options: PackagingOption[]
  defaultPackaging: DefaultPackaging
  selectedId: string | null
  onSelect: (id: string | null) => void
  currencyCode: string
  disabled?: boolean
}

type Choice = {
  id: string | null
  title: string
  description: string | null
  image_url: string | null
  dimensions: string | null
  price: string
}

const PackagingModal = ({
  isOpen,
  close,
  options,
  defaultPackaging,
  selectedId,
  onSelect,
  currencyCode,
  disabled,
}: PackagingModalProps) => {
  const choices: Choice[] = [
    {
      id: null,
      title: defaultPackaging.title,
      description: defaultPackaging.description,
      image_url: defaultPackaging.image_url,
      dimensions: null,
      price: "Безкоштовно",
    },
    ...options.map((option) => ({
      id: option.id,
      title: option.title,
      description: option.description,
      image_url: option.image_url,
      dimensions: formatDimensions(option),
      price: `+${convertToLocale({
        amount: option.price,
        currency_code: currencyCode,
      })}`,
    })),
  ]

  return (
    <Modal isOpen={isOpen} close={close} size="large" data-testid="packaging-modal">
      <div className="flex items-center justify-between">
        <DialogTitle as="span" className="text-sm font-semibold text-ink">
          Оберіть пакування
        </DialogTitle>
        <button
          type="button"
          onClick={close}
          aria-label="Закрити"
          data-testid="close-modal-button"
        >
          <X size={20} />
        </button>
      </div>
      <div className="mt-4 min-h-0 overflow-y-auto pr-1">
        <div
          role="radiogroup"
          aria-label="Пакування"
          className="grid grid-cols-2 small:grid-cols-3 gap-3"
        >
          {choices.map((choice) => {
            const checked = choice.id === selectedId
            return (
              <button
                key={choice.id ?? "default"}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onSelect(choice.id)}
                className={clx(
                  "flex flex-col overflow-hidden rounded-rounded border bg-ui-bg-subtle text-left transition-shadow duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-60",
                  checked
                    ? "border-ui-border-interactive shadow-elevation-card-rest"
                    : "border-ui-border-base hover:shadow-elevation-card-rest"
                )}
                data-testid="packaging-modal-choice"
              >
                <div className="relative flex aspect-square w-full items-center justify-center bg-milk">
                  {choice.image_url ? (
                    <img
                      src={choice.image_url}
                      alt={choice.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <PackageIcon size="40" className="text-graphite" />
                  )}
                  {checked && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ui-fg-interactive text-white">
                      <CheckIcon size="16" />
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-y-0.5 p-3">
                  <span className="text-small-regular font-medium text-ink">
                    {choice.title}
                  </span>
                  {choice.dimensions && (
                    <span className="text-xsmall-regular text-graphite">
                      Розмір: {choice.dimensions}
                    </span>
                  )}
                  {choice.description && (
                    <span className="text-xsmall-regular text-graphite line-clamp-2">
                      {choice.description}
                    </span>
                  )}
                  <span className="mt-auto pt-1 text-small-regular text-ink">
                    {choice.price}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default PackagingModal
