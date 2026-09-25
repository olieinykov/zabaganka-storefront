import { Metadata } from "next"

import FaqAccordion, { FaqItem } from "@modules/info/components/faq-accordion"
import PageHero from "@modules/info/components/page-hero"

export const metadata: Metadata = {
  title: "Часті питання | Zabaganka Boutique",
  description:
    "Доставка, оплата, обмін і повернення, догляд за прикрасами — відповіді на найчастіші питання покупців Zabaganka Boutique.",
}

const HIGHLIGHTS = [
  {
    value: "1–3 дні",
    label: "Доставка по Україні",
    text: "Нова Пошта та Укрпошта — у відділення, поштомат або кур'єром.",
  },
  {
    value: "14 днів",
    label: "На обмін і повернення",
    text: "Для аксесуарів і біжутерії належної якості.",
  },
  {
    value: "100%",
    label: "Безпечна оплата",
    text: "Plata by mono або накладений платіж при отриманні.",
  },
]

const SECTIONS: { id: string; title: string; items: FaqItem[] }[] = [
  {
    id: "orders",
    title: "Замовлення",
    items: [
      {
        id: "orders-how",
        question: "Як оформити замовлення?",
        answer: (
          <p>
            Додайте прикраси до кошика, перейдіть до оформлення та заповніть
            контактні дані й адресу доставки. Після оплати або підтвердження
            накладеного платежу ми надішлемо лист із номером замовлення на
            вашу пошту.
          </p>
        ),
      },
      {
        id: "orders-account",
        question: "Чи потрібно реєструватися, щоб зробити замовлення?",
        answer: (
          <p>
            Ні, оформити замовлення можна без реєстрації. Проте з особистим
            кабінетом зручніше відстежувати статус замовлень і зберігати
            адреси доставки.
          </p>
        ),
      },
      {
        id: "orders-change",
        question: "Чи можна змінити або скасувати замовлення?",
        answer: (
          <p>
            Так, поки замовлення не передане службі доставки. Напишіть нам в
            Instagram або Telegram, вказавши номер замовлення, — ми внесемо
            зміни або повернемо кошти, якщо оплата вже пройшла.
          </p>
        ),
      },
      {
        id: "orders-out-of-stock",
        question: "Що робити, якщо потрібного розміру немає в наявності?",
        answer: (
          <p>
            На сторінці товару натисніть «Повідомити, коли з'явиться» — ми
            надішлемо лист, щойно виріб повернеться на склад.
          </p>
        ),
      },
    ],
  },
  {
    id: "shipping",
    title: "Доставка",
    items: [
      {
        id: "shipping-methods",
        question: "Якими службами ви доставляєте?",
        answer: (
          <>
            <p>Ми відправляємо замовлення по всій Україні:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Нова Пошта — у відділення, поштомат або кур'єром;</li>
              <li>Укрпошта — у відділення або кур'єром.</li>
            </ul>
          </>
        ),
      },
      {
        id: "shipping-time",
        question: "Скільки часу займає доставка?",
        answer: (
          <p>
            Замовлення, оформлені до 14:00 у робочі дні, відправляємо того ж
            дня. Доставка Новою Поштою зазвичай триває 1–2 дні, Укрпоштою —
            3–5 днів.
          </p>
        ),
      },
      {
        id: "shipping-cost",
        question: "Скільки коштує доставка?",
        answer: (
          <p>
            Вартість розраховується за тарифами перевізника й відображається
            на етапі оформлення замовлення. Для замовлень від 3 000 ₴ доставка
            Новою Поштою безкоштовна.
          </p>
        ),
      },
      {
        id: "shipping-tracking",
        question: "Як відстежити посилку?",
        answer: (
          <p>
            Після відправлення ми надішлемо номер ТТН на вашу пошту. Статус
            посилки можна перевірити на сайті або в застосунку перевізника.
          </p>
        ),
      },
    ],
  },
  {
    id: "payment",
    title: "Оплата",
    items: [
      {
        id: "payment-methods",
        question: "Які способи оплати доступні?",
        answer: (
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              Оплата карткою онлайн через Plata by mono (Visa, Mastercard,
              Apple Pay, Google Pay);
            </li>
            <li>Накладений платіж із невеликою передоплатою;</li>
            <li>Накладений платіж без передоплати.</li>
          </ul>
        ),
      },
      {
        id: "payment-safety",
        question: "Чи безпечно оплачувати карткою на сайті?",
        answer: (
          <p>
            Так. Дані картки вводяться на захищеній сторінці monobank, ми їх
            не бачимо й не зберігаємо. Після оплати ви отримаєте фіскальний
            чек на пошту.
          </p>
        ),
      },
      {
        id: "payment-prepayment",
        question: "Навіщо передоплата при накладеному платежі?",
        answer: (
          <p>
            Передоплата покриває вартість доставки в обидва боки, якщо
            посилку не заберуть. Решту суми ви сплачуєте при отриманні у
            відділенні.
          </p>
        ),
      },
    ],
  },
  {
    id: "returns",
    title: "Обмін та повернення",
    items: [
      {
        id: "returns-terms",
        question: "Які умови обміну та повернення?",
        answer: (
          <p>
            Аксесуари та біжутерію належної якості можна обміняти або
            повернути протягом 14 днів з моменту отримання, якщо виріб не був
            у використанні, збережено бирки, пакування та чек.
          </p>
        ),
      },
      {
        id: "returns-jewelry",
        question: "Чи можна повернути ювелірні вироби?",
        answer: (
          <p>
            Відповідно до законодавства України ювелірні вироби з дорогоцінних
            металів і каміння належної якості обміну та поверненню не
            підлягають. Якщо ж ви виявили дефект — ми безкоштовно замінимо
            виріб або повернемо кошти.
          </p>
        ),
      },
      {
        id: "returns-how",
        question: "Як оформити повернення?",
        answer: (
          <p>
            Напишіть нам у Instagram або Telegram, вкажіть номер замовлення та
            причину повернення. Ми надішлемо адресу для відправлення, а кошти
            повернемо на картку протягом 3–7 робочих днів після отримання
            посилки.
          </p>
        ),
      },
      {
        id: "returns-defect",
        question: "Що робити, якщо виріб прийшов пошкодженим?",
        answer: (
          <p>
            Перевіряйте посилку у відділенні при отриманні. Якщо помітили
            пошкодження — складіть акт із працівником пошти та надішліть нам
            фото. Ми замінимо виріб за свій рахунок.
          </p>
        ),
      },
    ],
  },
  {
    id: "care",
    title: "Догляд і розміри",
    items: [
      {
        id: "care-size",
        question: "Як визначити розмір каблучки?",
        answer: (
          <p>
            Виміряйте внутрішній діаметр каблучки, яка вам підходить, або
            обгорніть палець ниткою та поділіть довжину на 3,14. Отримане
            значення в міліметрах і є вашим розміром. Якщо сумніваєтесь —
            напишіть нам, допоможемо підібрати.
          </p>
        ),
      },
      {
        id: "care-silver",
        question: "Як доглядати за срібними прикрасами?",
        answer: (
          <p>
            Зберігайте прикраси в мішечку окремо одна від одної, знімайте
            перед душем, басейном і нанесенням косметики. Для очищення
            використовуйте м'яку серветку для срібла.
          </p>
        ),
      },
      {
        id: "care-allergy",
        question: "Чи можуть прикраси викликати алергію?",
        answer: (
          <p>
            Ми обираємо гіпоалергенні сплави без нікелю. Для чутливої шкіри
            радимо вироби із срібла 925 проби або золота — склад вказаний в
            описі кожного товару.
          </p>
        ),
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Допомога"
        title="Часті питання"
        description="Зібрали відповіді про доставку, оплату, обмін та догляд за прикрасами. Не знайшли свого питання — напишіть нам."
      />

      <section className="bg-milk">
        <div className="content-container py-10 small:py-12 grid grid-cols-1 small:grid-cols-3 gap-6 small:gap-10">
          {HIGHLIGHTS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-1 border-l border-gold pl-5"
            >
              <span className="font-display text-3xl text-navy">
                {item.value}
              </span>
              <span className="text-xs uppercase tracking-[0.15em] text-ink font-semibold">
                {item.label}
              </span>
              <span className="text-sm text-graphite mt-1">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-[240px_1fr] gap-10 small:gap-16">
        <nav className="small:sticky small:top-32 self-start">
          <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
            Розділи
          </span>
          <ul className="mt-4 flex flex-wrap small:flex-col gap-2 small:gap-0">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="interactive block text-sm text-navy hover:text-gold border border-line rounded-sm px-3 py-1.5 small:border-0 small:border-b small:rounded-none small:px-0 small:py-3"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-14">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-32">
              <h2 className="font-display text-3xl small:text-4xl text-navy mb-6">
                {section.title}
              </h2>
              <FaqAccordion items={section.items} />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="content-container py-16 small:py-20 flex flex-col small:flex-row small:items-end justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-md">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Залишилися питання?
            </span>
            <h2 className="font-display text-3xl small:text-4xl leading-tight">
              Ми на зв'язку щодня з 9:00 до 21:00
            </h2>
            <p className="text-white/70 text-sm">
              Напишіть нам у зручному месенджері — відповімо протягом години.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm bg-white text-navy text-sm font-medium hover:bg-white/90"
            >
              Instagram
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noreferrer"
              className="interactive interactive-lift inline-flex items-center justify-center h-11 px-6 rounded-sm border border-white/40 text-white text-sm font-medium hover:border-white"
            >
              Telegram
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
