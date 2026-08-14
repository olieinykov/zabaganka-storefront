const PLACEHOLDER_TILES = 3

export default function InstagramSection() {
  return (
    <section className="bg-milk">
      <div className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-[1fr_1.4fr] gap-8 items-center">
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Instagram
          </span>
          <h2 className="font-display text-3xl small:text-4xl text-navy">
            Ближче до Zabaganka
          </h2>
          <p className="text-graphite text-sm max-w-xs">
            Новинки, деталі виробів і натхнення для ваших образів.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-navy text-white text-sm font-medium hover:bg-navy-hover w-fit"
          >
            Перейти в Instagram
          </a>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: PLACEHOLDER_TILES }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-md bg-sand flex items-center justify-center text-[11px] uppercase tracking-wide text-graphite"
            >
              Фото
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
