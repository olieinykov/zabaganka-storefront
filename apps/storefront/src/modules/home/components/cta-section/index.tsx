import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowRight from "@modules/common/icons/arrow-right"
import { CtaSectionContent } from "@lib/data/page-content-types"

export default function CtaSection({
  content,
}: {
  content: CtaSectionContent
}) {
  const { eyebrow, heading, button_label, button_href } = content

  return (
    <section className="content-container py-16 small:py-24 text-center flex flex-col items-center gap-3">
      {eyebrow && (
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl small:text-4xl text-navy max-w-lg leading-tight">
        {heading}
      </h2>
      {button_label && (
        <LocalizedClientLink
          href={button_href || "/contacts"}
          className="interactive inline-flex items-center gap-1.5 text-sm text-navy hover:text-gold underline decoration-line underline-offset-4 mt-1"
        >
          {button_label}
          <ArrowRight size={14} />
        </LocalizedClientLink>
      )}
    </section>
  )
}
