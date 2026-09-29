"use client"

import { ProductMediaItem } from "@lib/util/product-videos"
import { Container, clx } from "@modules/common/components/ui"
import ChevronLeft from "@modules/common/icons/chevron-left"
import ChevronRight from "@modules/common/icons/chevron-right"
import VideoPlayer from "@modules/products/components/video-player"
import ThumbnailRail from "./thumbnail-rail"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ImageGalleryProps = {
  media: ProductMediaItem[]
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

const ImageGallery = ({ media: slides }: ImageGalleryProps) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const typeNumbers = useMemo(() => {
    const counters = { image: 0, video: 0 }
    return slides.map((slide) => ++counters[slide.type])
  }, [slides])

  const isMultiple = slides.length > 1

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return

    const wrapped = ((index % slides.length) + slides.length) % slides.length
    const slide = track.children[wrapped] as HTMLElement | undefined
    if (!slide) return

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    })
  }, [slides.length])

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

  if (!slides.length) {
    return null
  }

  const windowStart = Math.max(
    0,
    Math.min(activeIndex - DOT_WINDOW_HALF, slides.length - MAX_VISIBLE_DOTS)
  )
  const visibleDots = slides
    .slice(windowStart, windowStart + MAX_VISIBLE_DOTS)
    .map((slide, i) => ({ slide, index: windowStart + i }))

  return (
    <div className="relative small:mx-16">
      <div
        className={clx(
          "relative flex items-start group",
          isMultiple && "small:mr-[92px]"
        )}
      >
        <div
          ref={trackRef}
          className={clx(
            "flex w-full overflow-x-auto no-scrollbar scroll-smooth",
            isMultiple && "snap-x snap-mandatory"
          )}
        >
          {slides.map((slide, index) => (
            <Container
              key={slide.id}
              className={clx(
                "relative aspect-[29/34] w-full shrink-0 overflow-hidden bg-ui-bg-subtle p-0",
                isMultiple && "snap-start snap-always"
              )}
              id={slide.id}
            >
              {slide.type === "image" ? (
                <Image
                  src={slide.url}
                  priority={index === 0}
                  className="absolute inset-0 rounded-rounded"
                  alt={`Зображення товару ${typeNumbers[index]}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              ) : (
                <VideoPlayer
                  src={slide.url}
                  label={`Відео товару ${typeNumbers[index]}`}
                  isActive={index === activeIndex}
                  hasPagination={isMultiple}
                  className="rounded-rounded"
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
              {visibleDots.map(({ slide, index }) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={
                    slide.type === "video"
                      ? `Перейти до відео ${typeNumbers[index]}`
                      : `Перейти до зображення ${typeNumbers[index]}`
                  }
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

      {isMultiple && (
        <ThumbnailRail
          slides={slides}
          typeNumbers={typeNumbers}
          activeIndex={activeIndex}
          onSelect={scrollToIndex}
          className="absolute inset-y-0 right-0 hidden w-20 small:block"
        />
      )}
    </div>
  )
}

export default ImageGallery