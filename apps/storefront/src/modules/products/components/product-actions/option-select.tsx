import { HttpTypes } from "@medusajs/types"
import { isOptionValueAvailable } from "@lib/util/product"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string | undefined) => void
  title: string
  disabled: boolean
  variants?: HttpTypes.StoreProductVariant[] | null
  selectedOptions?: Record<string, string | undefined>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  variants,
  selectedOptions = {},
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Обрати {title}</span>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const isAvailable = isOptionValueAvailable({
            variants,
            selectedOptions,
            optionId: option.id,
            value: v,
          })
          const isUnavailable = !isAvailable && v !== current

          return (
            <button
              onClick={() => updateOption(option.id, v === current ? undefined : v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular min-h-10 rounded-rounded px-3 py-2 flex-1 basis-[calc(50%-0.25rem)] min-w-fit text-center leading-tight",
                {
                  "border-ui-border-interactive": v === current,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    v !== current && !isUnavailable,
                  "opacity-40 cursor-not-allowed line-through decoration-1 hover:shadow-none":
                    isUnavailable,
                }
              )}
              disabled={disabled || isUnavailable}
              title={
                isUnavailable
                  ? "Ця комбінація недоступна"
                  : undefined
              }
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect