import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryShape from "@modules/common/icons/category-shape"
import ArrowRight from "@modules/common/icons/arrow-right"
import { HeroContent } from "@lib/data/page-content-types"

export default function Hero({ content }: { content: HeroContent }) {
  const {
    eyebrow,
    heading,
    subheading,
    primary_button_label,
    primary_button_href,
    secondary_button_label,
    secondary_button_href,
    image_url,
    image_alt,
  } = content

  return (
    <section className="bg-navy text-white">
      <div className="content-container grid grid-cols-1 small:grid-cols-2 min-h-[420px] small:min-h-[560px]">
        <div className="flex flex-col justify-center gap-6 py-16 small:py-0 pr-0 small:pr-10">
          {eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-4xl small:text-6xl leading-[1.05]">
            {heading}
          </h1>
          {subheading && (
            <p className="text-white/70 max-w-md">{subheading}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            {primary_button_label && (
              <LocalizedClientLink
                href={primary_button_href || "/store"}
                className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-white text-navy text-sm font-medium hover:bg-white/90"
              >
                {primary_button_label}
              </LocalizedClientLink>
            )}
            {secondary_button_label && (
              <LocalizedClientLink
                href={secondary_button_href || "/store"}
                className="interactive inline-flex items-center gap-1.5 text-sm text-white hover:text-gold"
              >
                {secondary_button_label}
                <ArrowRight size={14} />
              </LocalizedClientLink>
            )}
          </div>
        </div>
        <div className="hidden small:flex items-center justify-center border-l border-white/10 relative overflow-hidden">
          {image_url ? (
            <Image
              src={image_url}
              alt={image_alt || ""}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <CategoryShape shape="diamond" size={140} color="#3d4f6e" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                Брендове фото
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
