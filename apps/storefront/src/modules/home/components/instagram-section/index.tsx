import Image from "next/image"

import { InstagramSectionContent } from "@lib/data/page-content-types"

export default function InstagramSection({
  content,
}: {
  content: InstagramSectionContent
}) {
  const { eyebrow, heading, description, button_label, button_href, images } =
    content

  return (
    <section className="bg-milk">
      <div className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-[1fr_1.4fr] gap-8 items-center">
        <div className="flex flex-col gap-4">
          {eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl small:text-4xl text-navy">
            {heading}
          </h2>
          {description && (
            <p className="text-graphite text-sm max-w-xs">{description}</p>
          )}
          {button_label && (
            <a
              href={button_href || "https://instagram.com"}
              target="_blank"
              rel="noreferrer"
              className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-navy text-white text-sm font-medium hover:bg-navy-hover w-fit"
            >
              {button_label}
            </a>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="aspect-square rounded-md bg-sand flex items-center justify-center text-[11px] uppercase tracking-wide text-graphite relative overflow-hidden"
            >
              {image.image_url ? (
                <Image
                  src={image.image_url}
                  alt={image.alt || ""}
                  fill
                  className="object-cover"
                />
              ) : (
                "Фото"
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
