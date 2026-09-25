import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArrowRight from "@modules/common/icons/arrow-right"
import PageHero from "@modules/info/components/page-hero"
import PhotoSlot from "@modules/info/components/photo-slot"

export const metadata: Metadata = {
  title: "Про нас | Zabaganka Boutique",
  description:
    "Zabaganka Boutique — український бутик прикрас. Наша історія, цінності та підхід до кожного виробу.",
}

const PHOTOS = {
  // Vertical (3:4). Owner / team at the workbench or in the boutique,
  // warm natural light, hands working on a piece.
  story: { src: null, alt: "Команда Zabaganka Boutique за роботою" },
  // Horizontal (4:3). Close-up of jewellery on a light fabric or stone:
  // earrings / rings, shallow depth of field.
  detail: { src: null, alt: "Прикраси Zabaganka Boutique крупним планом" },
  // Square. Branded gift box / packaging with a ribbon and a card.
  packaging: { src: null, alt: "Фірмове пакування Zabaganka Boutique" },
  // Horizontal (4:3). Boutique interior or a showcase with displayed pieces.
  showroom: { src: null, alt: "Вітрина бутика Zabaganka Boutique" },
} satisfies Record<string, { src: string | null; alt: string }>

const STATS = [
  { value: "2019", label: "рік заснування" },
  { value: "12 000+", label: "задоволених клієнтів" },
  { value: "1 500+", label: "виробів у колекціях" },
  { value: "24", label: "області, куди ми доставляємо" },
]

const VALUES = [
  {
    title: "Якість без компромісів",
    text: "Працюємо з перевіреними українськими майстернями та постачальниками. Кожен виріб проходить огляд перед відправкою.",
  },
  {
    title: "Чесні ціни",
    text: "Без штучних знижок і прихованих націнок. Ви платите за метал, камінь і роботу майстра.",
  },
  {
    title: "Турбота після покупки",
    text: "Допоможемо з доглядом, підберемо розмір і підкажемо, як зберегти блиск прикраси на роки.",
  },
  {
    title: "Подарунок — це мистецтво",
    text: "Кожне замовлення пакуємо у фірмову коробку. За бажанням додамо листівку з вашими словами.",
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Про нас"
        title="Прикраси, що стають частиною вашої історії"
        description="Zabaganka Boutique — український бутик прикрас і аксесуарів. Ми віримо, що навіть маленька сережка може розповісти про людину більше, ніж слова."
      />

      <section className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-2 gap-10 small:gap-16 items-center">
        <PhotoSlot
          {...PHOTOS.story}
          placeholderLabel="Фото команди / майстерні"
          className="aspect-[3/4] w-full"
        />
        <div className="flex flex-col gap-5 max-w-lg">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Наша історія
          </span>
          <h2 className="font-display text-3xl small:text-4xl text-navy leading-tight">
            Від маленької вітрини у Львові до бутика з доставкою по всій Україні
          </h2>
          <p className="text-graphite text-sm leading-relaxed">
            Усе почалося у 2019 році з невеликої вітрини в центрі Львова, де ми
            продавали прикраси, які самі хотіли б носити. Ми довго шукали
            майстрів, яким можна довіряти, і вчилися відрізняти по-справжньому
            якісний виріб від просто красивого.
          </p>
          <p className="text-graphite text-sm leading-relaxed">
            Сьогодні Zabaganka Boutique — це онлайн-бутик і шоурум, де зібрано
            срібло, золото, прикраси з натуральним камінням та аксесуари.
            Ми самі відбираємо кожну модель, перевіряємо її перед відправкою й
            пакуємо так, щоб відкривати посилку було приємно.
          </p>
        </div>
      </section>

      <section className="bg-milk">
        <div className="content-container py-12 small:py-16 grid grid-cols-2 small:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
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

      <section className="bg-navy text-white">
        <div className="content-container py-16 small:py-20 grid grid-cols-1 small:grid-cols-2 gap-10">
          <div className="flex flex-col gap-3 max-w-sm">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Цінності
            </span>
            <h2 className="font-display text-3xl small:text-4xl">
              У що ми віримо
            </h2>
            <p className="text-white/70 text-sm">
              Чотири принципи, яких ми тримаємося з першого дня — від вибору
              постачальника до моменту, коли посилка потрапляє до ваших рук.
            </p>
          </div>
          <ul className="flex flex-col">
            {VALUES.map((value, index) => (
              <li
                key={value.title}
                className="flex items-start gap-4 py-[21px] border-t border-white/20 last:border-b last:border-white/20"
              >
                <span className="text-[11px] text-white/45 font-ui pt-1.5 shrink-0 w-6">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[21px] font-display text-white/90">
                    {value.title}
                  </span>
                  <span className="text-sm text-white/60">{value.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="content-container py-16 small:py-24">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Зсередини
          </span>
          <h2 className="font-display text-3xl small:text-4xl text-navy mt-1">
            Як ми працюємо
          </h2>
        </div>
        <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
          <div className="flex flex-col gap-3">
            <PhotoSlot
              {...PHOTOS.detail}
              placeholderLabel="Прикраси крупним планом"
              shape="circle"
              className="aspect-[4/3] w-full"
            />
            <h3 className="font-display text-xl text-navy">Ретельний відбір</h3>
            <p className="text-sm text-graphite">
              У колекцію потрапляє лише кожна п'ята модель, яку ми тестуємо.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <PhotoSlot
              {...PHOTOS.packaging}
              placeholderLabel="Фото пакування"
              className="aspect-[4/3] w-full"
            />
            <h3 className="font-display text-xl text-navy">Фірмове пакування</h3>
            <p className="text-sm text-graphite">
              Коробка, мішечок для зберігання та листівка — вже в комплекті.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <PhotoSlot
              {...PHOTOS.showroom}
              placeholderLabel="Фото шоуруму"
              shape="square"
              className="aspect-[4/3] w-full"
            />
            <h3 className="font-display text-xl text-navy">Шоурум у Львові</h3>
            <p className="text-sm text-graphite">
              Приміряти прикраси наживо можна за попереднім записом.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="content-container py-16 small:py-24 text-center flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Знайдіть свою прикрасу
          </span>
          <h2 className="font-display text-3xl small:text-4xl text-navy max-w-lg leading-tight">
            Кожна колекція створена з любов'ю до деталей
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-3">
            <LocalizedClientLink
              href="/store"
              className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-navy text-white text-sm font-medium hover:bg-navy-hover"
            >
              Перейти до каталогу
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/faq"
              className="interactive inline-flex items-center gap-1.5 text-sm text-navy hover:text-gold underline decoration-line underline-offset-4"
            >
              Часті питання
              <ArrowRight size={14} />
            </LocalizedClientLink>
          </div>
        </div>
      </section>
    </>
  )
}
