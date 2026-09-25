import Image from "next/image"

import { clx } from "@modules/common/components/ui"
import CategoryShape from "@modules/common/icons/category-shape"


export default function PhotoSlot({
  src,
  alt,
  placeholderLabel,
  shape = "diamond",
  className,
}: {
  src: string | null
  alt: string
  placeholderLabel: string
  shape?: "diamond" | "circle" | "square"
  className?: string
}) {
  return (
    <div
      className={clx(
        "bg-sand relative overflow-hidden flex items-center justify-center",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <CategoryShape shape={shape} size={80} color="#8a7a63" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-graphite">
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  )
}
