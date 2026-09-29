"use client"

import { clx } from "@modules/common/components/ui"
import { KeyboardEvent, useEffect, useRef } from "react"
import Check from "@modules/common/icons/check"

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

export function formatRate(rate: number): string {
  return `${String(rate).replace(".", ",")}×`
}

type SpeedMenuProps = {
  rate: number
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onRateChange: (rate: number) => void
}

const SpeedMenu = ({
  rate,
  isOpen,
  onOpenChange,
  onRateChange,
}: SpeedMenuProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener("pointerdown", handlePointerDown, true)
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true)
  }, [isOpen, onOpenChange])

  const rateRef = useRef(rate)
  rateRef.current = rate

  useEffect(() => {
    if (!isOpen) return
    const selected = PLAYBACK_RATES.findIndex((r) => r === rateRef.current)
    itemRefs.current[selected === -1 ? 0 : selected]?.focus()
  }, [isOpen])

  const close = () => {
    onOpenChange(false)
    buttonRef.current?.focus()
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()

    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[]
    const index = items.indexOf(document.activeElement as HTMLButtonElement)

    switch (event.key) {
      case "Escape":
        event.preventDefault()
        close()
        break
      case "ArrowDown":
        event.preventDefault()
        items[(index + 1) % items.length]?.focus()
        break
      case "ArrowUp":
        event.preventDefault()
        items[(index - 1 + items.length) % items.length]?.focus()
        break
      case "Tab":
        onOpenChange(false)
        break
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Швидкість відтворення: ${formatRate(rate)}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
        className={clx(
          "flex h-8 min-w-[2.75rem] items-center justify-center rounded-circle px-2 font-ui text-xs font-medium tabular-nums interactive hover:bg-milk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
          rate === 1 ? "text-ink" : "text-gold",
          isOpen && "bg-milk"
        )}
      >
        {formatRate(rate)}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Швидкість відтворення"
          onKeyDown={handleMenuKeyDown}
          className="absolute bottom-full right-0 z-10 mb-2 min-w-[8.5rem] rounded-large border border-line bg-ivory p-1 shadow-sm animate-fade-in-top"
        >
          <p className="px-3 pb-1 pt-1.5 font-ui text-[11px] uppercase tracking-wider text-graphite">
            Швидкість
          </p>
          {PLAYBACK_RATES.map((option, index) => {
            const isSelected = option === rate
            return (
              <button
                key={option}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => {
                  onRateChange(option)
                  close()
                }}
                className={clx(
                  "flex w-full items-center justify-between gap-x-3 rounded-rounded px-3 py-1.5 font-ui text-sm tabular-nums interactive hover:bg-milk focus-visible:bg-milk focus-visible:outline-none",
                  isSelected ? "text-gold" : "text-ink"
                )}
              >
                <span>{option === 1 ? "Звичайна" : formatRate(option)}</span>
                {isSelected && <Check size={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SpeedMenu
