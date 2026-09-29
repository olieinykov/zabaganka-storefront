"use client"

import { ProductMediaItem, withFirstFrameHint } from "@lib/util/product-videos"
import { clx } from "@modules/common/components/ui"
import ChevronDown from "@modules/common/icons/chevron-down"
import Play from "@modules/common/icons/play"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

type ThumbnailRailProps = {
  slides: ProductMediaItem[]
  typeNumbers: number[]
  activeIndex: number
  onSelect: (index: number) => void
  className?: string
}

const ARROW_SCROLL_RATIO = 0.8

const ThumbnailRail = ({
  slides,
  typeNumbers,
  activeIndex,
  onSelect,
  className,
}: ThumbnailRailProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const updateScrollState = useCallback(() => {
    const list = listRef.current
    if (!list) return
    setCanScrollUp(list.scrollTop > 1)
    setCanScrollDown(list.scrollTop + list.clientHeight < list.scrollHeight - 1)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    updateScrollState()
    list.addEventListener("scroll", updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(list)
    return () => {
      list.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState, slides.length])

  useEffect(() => {
    const list = listRef.current
    const thumb = list?.children[activeIndex] as HTMLElement | undefined
    if (!list || !thumb) return

    const top = thumb.offsetTop
    const bottom = top + thumb.offsetHeight
    if (top < list.scrollTop) {
      list.scrollTo({ top, behavior: "smooth" })
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight, behavior: "smooth" })
    }
  }, [activeIndex])

  const scrollByPage = (direction: -1 | 1) => {
    const list = listRef.current
    if (!list) return
    list.scrollBy({
      top: direction * list.clientHeight * ARROW_SCROLL_RATIO,
      behavior: "smooth",
    })
  }

  const arrowClass =
    "absolute left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-circle border border-line bg-ivory/90 text-ink shadow-sm interactive hover:bg-milk opacity-0 group-hover/rail:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"

  return (
    <div className={clx("group/rail", className)}>
      <div
        ref={listRef}
        className="relative flex h-full flex-col gap-2 overflow-y-auto overscroll-contain no-scrollbar"
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          const label =
            slide.type === "video"
              ? `Відео товару ${typeNumbers[index]}`
              : `Зображення товару ${typeNumbers[index]}`

          return (
            <button
              key={slide.id}
              type="button"
              aria-label={`Показати: ${label}`}
              aria-current={isActive}
              onClick={() => onSelect(index)}
              className={clx(
                "relative aspect-[29/34] w-full shrink-0 overflow-hidden rounded-rounded border bg-milk interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                isActive
                  ? "border-gold"
                  : "border-line opacity-70 hover:opacity-100"
              )}
            >
              {slide.type === "image" ? (
                <Image
                  src={slide.url}
                  alt=""
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <>
                  <video
                    src={withFirstFrameHint(slide.url)}
                    preload="metadata"
                    muted
                    playsInline
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-circle border border-line bg-ivory/90 text-ink shadow-sm">
                    <Play size={10} />
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {canScrollUp && (
        <button
          type="button"
          aria-label="Прокрутити мініатюри вгору"
          onClick={() => scrollByPage(-1)}
          className={clx(arrowClass, "top-1")}
        >
          <ChevronDown size={14} className="rotate-180" />
        </button>
      )}
      {canScrollDown && (
        <button
          type="button"
          aria-label="Прокрутити мініатюри вниз"
          onClick={() => scrollByPage(1)}
          className={clx(arrowClass, "bottom-1")}
        >
          <ChevronDown size={14} />
        </button>
      )}
    </div>
  )
}

export default ThumbnailRail
