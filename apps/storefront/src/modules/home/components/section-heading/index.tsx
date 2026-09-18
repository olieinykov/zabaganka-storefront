import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowRight from "@modules/common/icons/arrow-right"

export default function SectionHeading({
  eyebrow,
  title,
  linkHref,
  linkLabel,
}: {
  eyebrow: string
  title: string
  linkHref?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4 max-[510px]:flex-col max-[510px]:items-start">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
          {eyebrow}
        </span>
        <h2 className="font-display text-3xl small:text-4xl text-navy mt-1 max-[320px]:leading-tight">
          {title}
        </h2>
      </div>
      {linkHref && linkLabel && (
        <LocalizedClientLink
          href={linkHref}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm text-navy hover:text-gold interactive underline decoration-line underline-offset-4"
        >
          <span>{linkLabel}</span>
          <ArrowRight size={14} />
        </LocalizedClientLink>
      )}
    </div>
  )
}