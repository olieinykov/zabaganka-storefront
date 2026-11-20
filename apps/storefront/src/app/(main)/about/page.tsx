import { Metadata } from "next"

import { getPageContent } from "@lib/data/page-content"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowRight from "@modules/common/icons/arrow-right"
import PageHero from "@modules/info/components/page-hero"
import PhotoSlot from "@modules/info/components/photo-slot"

export const metadata: Metadata = {
  title: "Про нас | Zabaganka Boutique",
  description:
    "Zabaganka Boutique — український бутик прикрас. Наша історія, цінності та підхід до кожного виробу.",
}

const PROCESS_PLACEHOLDER_SHAPES = ["circle", "diamond", "square"] as const

function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export default async function AboutPage() {
  const { hero, story, stats, values, process, cta } =
    await getPageContent("about")

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.heading}
        description={hero.description}
      />

      <section className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-2 gap-10 small:gap-16 items-center">
        <PhotoSlot
          src={story.image_url}
          alt={story.image_alt}
          placeholderLabel="Фото команди / майстерні"
          className="aspect-[3/4] w-full"
        />
        <div className="flex flex-col gap-5 max-w-lg">
          {story.eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              {story.eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl small:text-4xl text-navy leading-tight">
            {story.heading}
          </h2>
          {toParagraphs(story.body).map((paragraph, index) => (
            <p
              key={index}
              className="text-graphite text-sm leading-relaxed whitespace-pre-line"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      {stats.items.length > 0 && (
        <section className="bg-milk">
          <div className="content-container py-12 small:py-16 grid grid-cols-2 small:grid-cols-4 gap-8">
            {stats.items.map((stat) => (
              <div key={stat.id} className="flex flex-col gap-1">
                <span className="font-display text-4xl small:text-5xl text-navy">
                  {stat.value}
                </span>
                <span className="text-xs uppercase tracking-[0.15em] text-graphite">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-navy text-white">
        <div className="content-container py-16 small:py-20 grid grid-cols-1 small:grid-cols-2 gap-10">
          <div className="flex flex-col gap-3 max-w-sm">
            {values.eyebrow && (
              <span className="text-xs uppercase tracking-[0.2em] text-white/60">
                {values.eyebrow}
              </span>
            )}
            <h2 className="font-display text-3xl small:text-4xl">
              {values.heading}
            </h2>
            {values.description && (
              <p className="text-white/70 text-sm">{values.description}</p>
            )}
          </div>
          <ul className="flex flex-col">
            {values.items.map((value, index) => (
              <li
                key={value.id}
                className="flex items-start gap-4 py-[21px] border-t border-white/20 last:border-b last:border-white/20"
              >
                <span className="text-[11px] text-white/45 font-ui pt-1.5 shrink-0 w-6">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[21px] font-display text-white/90">
                    {value.title}
                  </span>
                  {value.text && (
                    <span className="text-sm text-white/60">{value.text}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {process.items.length > 0 && (
        <section className="content-container py-16 small:py-24">
          <div className="mb-8">
            {process.eyebrow && (
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                {process.eyebrow}
              </span>
            )}
            <h2 className="font-display text-3xl small:text-4xl text-navy mt-1">
              {process.heading}
            </h2>
          </div>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
            {process.items.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-3">
                <PhotoSlot
                  src={item.image_url}
                  alt={item.image_alt}
                  placeholderLabel={item.title}
                  shape={
                    PROCESS_PLACEHOLDER_SHAPES[
                      index % PROCESS_PLACEHOLDER_SHAPES.length
                    ]
                  }
                  className="aspect-[4/3] w-full"
                />
                <h3 className="font-display text-xl text-navy">
                  {item.title}
                </h3>
                {item.text && (
                  <p className="text-sm text-graphite">{item.text}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-line">
        <div className="content-container py-16 small:py-24 text-center flex flex-col items-center gap-3">
          {cta.eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
              {cta.eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl small:text-4xl text-navy max-w-lg leading-tight">
            {cta.heading}
          </h2>
          {(cta.primary_button_label || cta.secondary_button_label) && (
            <div className="flex flex-wrap items-center justify-center gap-6 mt-3">
              {cta.primary_button_label && (
                <LocalizedClientLink
                  href={cta.primary_button_href || "/store"}
                  className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-navy text-white text-sm font-medium hover:bg-navy-hover"
                >
                  {cta.primary_button_label}
                </LocalizedClientLink>
              )}
              {cta.secondary_button_label && (
                <LocalizedClientLink
                  href={cta.secondary_button_href || "/faq"}
                  className="interactive inline-flex items-center gap-1.5 text-sm text-navy hover:text-gold underline decoration-line underline-offset-4"
                >
                  {cta.secondary_button_label}
                  <ArrowRight size={14} />
                </LocalizedClientLink>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
