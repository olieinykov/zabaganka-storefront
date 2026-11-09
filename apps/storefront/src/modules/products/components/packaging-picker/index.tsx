"use client"

import { convertToLocale } from "@lib/util/money"
import {
  DefaultPackaging,
  formatDimensions,
  PackagingOption,
} from "@lib/util/packaging"
import PackagingModal from "@modules/common/components/packaging-modal"
import PackageIcon from "@modules/common/icons/package"
import { useState } from "react"

type PackagingPickerProps = {
  options: PackagingOption[]
  defaultPackaging: DefaultPackaging
  selected: PackagingOption | null
  onChange: (option: PackagingOption | null) => void
  currencyCode: string
  disabled?: boolean
}

const PackagingPicker = ({
  options,
  defaultPackaging,
  selected,
  onChange,
  currencyCode,
  disabled,
}: PackagingPickerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const select = (id: string | null) => {
    onChange(options.find((option) => option.id === id) ?? null)
    setIsModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid="packaging-picker">
      {selected ? (
        <div className="flex items-center gap-x-3 rounded-rounded border border-ui-border-interactive bg-ui-bg-subtle p-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-base bg-milk">
            {selected.image_url ? (
              <img
                src={selected.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <PackageIcon className="text-graphite" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xsmall-regular text-graphite">Пакування</span>
            <span className="truncate text-small-regular font-medium text-ink">
              {selected.title}
            </span>
            <span className="text-xsmall-regular text-graphite">
              {formatDimensions(selected)}
            </span>
            <span className="text-small-regular text-ink">
              +
              {convertToLocale({
                amount: selected.price,
                currency_code: currencyCode,
              })}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-y-1">
            <button
              type="button"
              className="text-small-regular text-ui-fg-interactive hover:underline disabled:opacity-50"
              onClick={() => setIsModalOpen(true)}
              disabled={disabled}
              data-testid="packaging-change-button"
            >
              Змінити
            </button>
            <button
              type="button"
              className="text-small-regular text-graphite hover:underline disabled:opacity-50"
              onClick={() => onChange(null)}
              disabled={disabled}
              data-testid="packaging-remove-button"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-x-2 text-small-regular text-graphite">
          <PackageIcon size="18" className="shrink-0" />
          <span data-testid="packaging-default-text">
            {defaultPackaging.title} вже включено
          </span>
        </div>
      )}

      {!!options.length && !selected && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="flex h-10 w-full items-center justify-center rounded-rounded border border-ui-border-base bg-ui-bg-subtle px-3 text-small-regular text-ink transition-shadow duration-150 ease-in-out hover:shadow-elevation-card-rest disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="packaging-add-button"
        >
          Додати пакування
        </button>
      )}

      {!!options.length && (
        <PackagingModal
          isOpen={isModalOpen}
          close={() => setIsModalOpen(false)}
          options={options}
          defaultPackaging={defaultPackaging}
          selectedId={selected?.id ?? null}
          onSelect={select}
          currencyCode={currencyCode}
          disabled={disabled}
        />
      )}
    </div>
  )
}

export default PackagingPicker
