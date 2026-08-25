import { WhyUsContent } from "@lib/data/page-content-types"

export default function WhyUs({ content }: { content: WhyUsContent }) {
  const { eyebrow, heading, description, features } = content

  return (
    <section className="bg-navy text-white">
      <div className="content-container py-16 small:py-20 grid grid-cols-1 small:grid-cols-2 gap-10">
        <div className="flex flex-col gap-3 max-w-sm">
          {eyebrow && (
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl small:text-4xl">{heading}</h2>
          {description && (
            <p className="text-white/70 text-sm">{description}</p>
          )}
        </div>
        <ul className="flex flex-col">
          {features.map((feature, index) => (
            <li
              key={feature.id}
              className="flex items-start gap-4 py-[21px] border-t border-white/20 last:border-b last:border-white/20"
            >
              <span className="text-[11px] text-white/45 font-ui pt-1 shrink-0 w-6">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="m-0 font-medium text-[21px] font-display text-white/90">
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
