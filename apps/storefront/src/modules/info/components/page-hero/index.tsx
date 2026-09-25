export default function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <section className="bg-navy text-white">
      <div className="content-container py-16 small:py-24 flex flex-col gap-4 max-w-3xl">
        <span className="text-xs uppercase tracking-[0.2em] text-white/60">
          {eyebrow}
        </span>
        <h1 className="font-display text-4xl small:text-6xl leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="text-white/70 max-w-xl">{description}</p>
        )}
      </div>
    </section>
  )
}
