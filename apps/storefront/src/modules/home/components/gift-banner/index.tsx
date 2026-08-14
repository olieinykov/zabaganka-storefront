import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryShape from "@modules/common/icons/category-shape"

export default function GiftBanner() {
  return (
    <section className="grid grid-cols-1 small:grid-cols-2 min-h-[380px]">
      <div className="bg-sand flex items-center justify-center py-16 small:py-0">
        <div className="flex flex-col items-center gap-4">
          <CategoryShape shape="diamond" size={100} color="#8a7a63" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-graphite">
            Фото пакування
          </span>
        </div>
      </div>
      <div className="bg-navy text-white flex items-center py-16">
        <div className="max-w-md px-6 small:px-16 flex flex-col gap-4">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
            Особливий подарунок
          </span>
          <h2 className="font-display text-3xl small:text-4xl leading-tight">
            Турбота відчувається ще до відкриття
          </h2>
          <p className="text-white/70 text-sm">
            Оберіть оформлення, яке зробить момент вручення ще особливішим:
            коробку, пакет, стрічку або додаткове подарункове пакування.
          </p>
          <LocalizedClientLink
            href="/store"
            className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-white text-navy text-sm font-medium hover:bg-white/90 w-fit mt-2"
          >
            Обрати пакування
          </LocalizedClientLink>
          <span className="text-xs text-white/50">
            Види та вартість пакування буде уточнено.
          </span>
        </div>
      </div>
    </section>
  )
}
