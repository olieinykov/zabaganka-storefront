import SectionHeading from "@modules/home/components/section-heading"

/**
 * There's no reviews/testimonials module on the backend yet, so this is an
 * honest placeholder rather than fabricated quotes. Swap the placeholder
 * block for a real list once a reviews source (backend module, or a
 * third-party like Judge.me/Loox synced via metadata) is available.
 */
export default function Testimonials() {
  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeading eyebrow="Відгуки" title="Слова наших покупців" />
      <div className="border border-line rounded-md bg-white py-20 flex flex-col items-center justify-center text-center gap-2">
        <p className="text-graphite max-w-md">
          Тут з&apos;являться справжні відгуки покупців після надання
          матеріалів.
        </p>
        <p className="text-xs text-graphite/70">
          Можна додати текст, фото товару або скриншот з Instagram.
        </p>
      </div>
    </section>
  )
}
