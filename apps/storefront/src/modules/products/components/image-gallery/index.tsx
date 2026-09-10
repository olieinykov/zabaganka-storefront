"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@modules/common/components/ui"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const MAX_VISIBLE_DOTS = 7

const DOT_WINDOW_HALF = Math.floor((MAX_VISIBLE_DOTS - 1) / 2)

function getDotSizeClass(distanceFromActive: number): string {
  if (distanceFromActive === 0) {
    return "w-5 h-1.5 bg-gold"
  }
  if (DOT_WINDOW_HALF <= 1 || distanceFromActive < DOT_WINDOW_HALF - 1) {
    return "w-1.5 h-1.5 bg-graphite/40 hover:bg-graphite/70"
  }
  if (distanceFromActive === DOT_WINDOW_HALF - 1) {
    return "w-1 h-1 bg-graphite/25"
  }
  return "w-[3px] h-[3px] bg-graphite/15"
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const isMultiple = images.length > 1

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return

    const wrapped = ((index % images.length) + images.length) % images.length
    const slide = track.children[wrapped] as HTMLElement | undefined
    if (!slide) return

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    })
  }, [images.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !isMultiple) {
      return
    }

    let frame: number | null = null

    const handleScroll = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
      frame = requestAnimationFrame(() => {
        const { scrollLeft, clientWidth } = track
        if (!clientWidth) return
        const index = Math.round(scrollLeft / clientWidth)
        setActiveIndex((prev) => (prev === index ? prev : index))
      })
    }

    track.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      track.removeEventListener("scroll", handleScroll)
      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [isMultiple])

  if (!images.length) {
    return null
  }

  const windowStart = Math.max(
    0,
    Math.min(activeIndex - DOT_WINDOW_HALF, images.length - MAX_VISIBLE_DOTS)
  )
  const visibleDots = images
    .slice(windowStart, windowStart + MAX_VISIBLE_DOTS)
    .map((image, i) => ({ image, index: windowStart + i }))

  return (
    <div className="relative flex items-start group small:mx-16">
      <div
        ref={trackRef}
        className={clx(
          "flex w-full overflow-x-auto no-scrollbar scroll-smooth",
          isMultiple && "snap-x snap-mandatory"
        )}
      >
        {images.map((image, index) => (
          <Container
            key={image.id}
            className={clx(
              "relative aspect-[29/34] w-full shrink-0 overflow-hidden bg-ui-bg-subtle p-0",
              isMultiple && "snap-start snap-always"
            )}
            id={image.id}
          >
            {!!image.url && (
              <Image
                src={image.url}
                priority={index === 0}
                className="absolute inset-0 rounded-rounded"
                alt={`Зображення товару ${index + 1}`}
                fill
                sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                style={{
                  objectFit: "cover",
                }}
              />
            )}
          </Container>
        ))}
      </div>

      {isMultiple && (
        <>
          <button
            type="button"
            aria-label="Попереднє зображення"
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="hidden small:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-circle bg-ivory/90 border border-line text-ink shadow-sm interactive opacity-0 group-hover:opacity-100 hover:bg-milk focus-visible:opacity-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Наступне зображення"
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="hidden small:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-circle bg-ivory/90 border border-line text-ink shadow-sm interactive opacity-0 group-hover:opacity-100 hover:bg-milk focus-visible:opacity-100"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-circle bg-ivory/90 border border-line shadow-sm px-2.5 py-1.5">
            {visibleDots.map(({ image, index }) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Перейти до зображення ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => scrollToIndex(index)}
                className={clx(
                  "shrink-0 rounded-circle transition-all duration-300",
                  getDotSizeClass(Math.abs(index - activeIndex))
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default ImageGallery