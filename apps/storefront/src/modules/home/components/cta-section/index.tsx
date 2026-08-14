import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowRight from "@modules/common/icons/arrow-right"

export default function CtaSection() {
  return (
    <section className="content-container py-16 small:py-24 text-center flex flex-col items-center gap-3">
      <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
        Потрібна допомога?
      </span>
      <h2 className="font-display text-3xl small:text-4xl text-navy max-w-lg leading-tight">
        Підберемо прикрасу для вас або на подарунок
      </h2>
      <LocalizedClientLink
        href="/contacts"
        className="interactive inline-flex items-center gap-1.5 text-sm text-navy hover:text-gold underline decoration-line underline-offset-4 mt-1"
      >
        Написати нам
        <ArrowRight size={14} />
      </LocalizedClientLink>
    </section>
  )
}
