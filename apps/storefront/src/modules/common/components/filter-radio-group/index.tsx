import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@modules/common/components/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: string
  handleChange: (value: string) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="flex flex-col gap-y-3">
      <Text className="txt-compact-small-plus text-ui-fg-muted">{title}</Text>
      <RadioGroup data-testid={dataTestId}>
        {items?.map((i) => {
          const isSelected = i.value === value

          return (
            <div
              key={i.value}
              className="relative flex items-center pl-4 py-1"
            >
              {isSelected && (
                <span className="absolute left-[-7px] flex items-center justify-center">
                  <EllipseMiniSolid />
                </span>
              )}
              <RadioGroup.Item
                checked={isSelected}
                onChange={() => handleChange(i.value)}
                className="hidden peer"
                id={i.value}
                value={i.value}
              />
              <Label
                htmlFor={i.value}
                className={clx(
                  "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer transition-colors",
                  {
                    "text-ui-fg-base font-medium": isSelected,
                  }
                )}
                data-testid="radio-label"
                data-active={isSelected}
              >
                {i.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup