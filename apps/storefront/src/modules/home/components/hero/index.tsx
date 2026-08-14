import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryShape from "@modules/common/icons/category-shape"
import ArrowRight from "@modules/common/icons/arrow-right"

export default function Hero() {
  return (
    <section className="bg-navy text-white">
      <div className="content-container grid grid-cols-1 small:grid-cols-2 min-h-[420px] small:min-h-[560px]">
        <div className="flex flex-col justify-center gap-6 py-16 small:py-0 pr-0 small:pr-10">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
            Zabaganka Boutique
          </span>
          <h1 className="font-display text-4xl small:text-6xl leading-[1.05]">
            Прикраси, які стають частиною вашої історії
          </h1>
          <p className="text-white/70 max-w-md">
            Вишукані деталі для особливих моментів і щоденних образів
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <LocalizedClientLink
              href="/store"
              className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-white text-navy text-sm font-medium hover:bg-white/90"
            >
              Перейти до каталогу
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store?sortBy=created_at"
              className="interactive inline-flex items-center gap-1.5 text-sm text-white hover:text-gold"
            >
              Переглянути новинки
              <ArrowRight size={14} />
            </LocalizedClientLink>
          </div>
        </div>
        <div className="hidden small:flex items-center justify-center border-l border-white/10">
          <div className="flex flex-col items-center gap-4">
            <CategoryShape shape="diamond" size={140} color="#3d4f6e" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              Брендове фото
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
