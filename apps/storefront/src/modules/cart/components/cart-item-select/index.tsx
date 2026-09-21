"use client"

import { clx } from "@modules/common/components/ui"
import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import ChevronDown from "@modules/common/icons/chevron-down"

type CartItemSelectProps = {
  value: number
  onChange: (value: number) => void
  options: number[]
  "data-testid"?: string
}

const CartItemSelect = ({
  value,
  onChange,
  options,
  "data-testid": dataTestId,
}: CartItemSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    width: number
    openUpwards: boolean
  } | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = () => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const dropdownHeight = 224 // max-h-56
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight

    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 64),
      openUpwards: openUp,
    })
  }

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    const onScrollOrResize = () => {
      updatePosition()
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)

    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [isOpen])

  return (
    <div className="inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid={dataTestId}
        className={clx(
          "inline-flex items-center justify-between gap-1.5 h-9 min-w-[3.75rem] px-3",
          "rounded-full border border-ui-border-base bg-gray-100 hover:bg-gray-200/70",
          "text-ui-fg-base txt-compact-small font-normal transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
        )}
      >
        <span className="tabular-nums leading-none font-normal">{value}</span>
        <span
          className={clx(
            "text-ui-fg-subtle transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </span>
      </button>

      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            style={{
              position: "fixed",
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              top: coords.openUpwards ? "auto" : `${coords.top}px`,
              bottom: coords.openUpwards
                ? `${window.innerHeight - coords.top}px`
                : "auto",
            }}
            className={clx(
              "z-[9999] max-h-56 overflow-y-auto rounded-lg border border-ui-border-base bg-white py-1 shadow-xl",
              "[scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]",
              "[&::-webkit-scrollbar]:w-1.5",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:bg-gray-300",
              "[&::-webkit-scrollbar-thumb]:rounded-full",
              "hover:[&::-webkit-scrollbar-thumb]:bg-gray-400"
            )}
          >
            {options.map((qty) => {
              const isSelected = qty === value

              return (
                <li
                  key={qty}
                  role="option"
                  aria-selected={isSelected}
                  className={clx(
                    "flex items-center justify-center px-3 py-1.5 txt-compact-small cursor-pointer select-none transition-colors",
                    isSelected
                      ? "bg-gray-200 text-ui-fg-base"
                      : "text-ui-fg-subtle hover:bg-ui-bg-subtle hover:text-ui-fg-base"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChange(qty)
                    setIsOpen(false)
                  }}
                  data-testid="product-select-option"
                >
                  <span className="tabular-nums font-normal">{qty}</span>
                </li>
              )
            })}
          </ul>,
          document.body
        )}
    </div>
  )
}

export default CartItemSelect