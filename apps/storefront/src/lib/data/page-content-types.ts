export type HeroContent = {
  eyebrow: string
  heading: string
  subheading: string
  primary_button_label: string
  primary_button_href: string
  secondary_button_label: string
  secondary_button_href: string
  image_url: string | null
  image_alt: string
}

export type CategoryGridImage = {
  category_id: string
  image_url: string | null
  image_alt: string
}

export type CategoryGridContent = {
  images: CategoryGridImage[]
}

export type GiftBannerContent = {
  image_url: string | null
  image_alt: string
  eyebrow: string
  heading: string
  description: string
  button_label: string
  button_href: string
  note: string
}

export type WhyUsFeature = { id: string; text: string }

export type WhyUsContent = {
  eyebrow: string
  heading: string
  description: string
  features: WhyUsFeature[]
}

export type InstagramImage = {
  id: string
  image_url: string | null
  alt: string
}

export type InstagramSectionContent = {
  eyebrow: string
  heading: string
  description: string
  button_label: string
  button_href: string
  images: InstagramImage[]
}

export type CtaSectionContent = {
  eyebrow: string
  heading: string
  button_label: string
  button_href: string
}

export type HomePageContent = {
  hero: HeroContent
  category_grid: CategoryGridContent
  gift_banner: GiftBannerContent
  why_us: WhyUsContent
  instagram_section: InstagramSectionContent
  cta_section: CtaSectionContent
}

export const HOME_PAGE_CONTENT_DEFAULTS: HomePageContent = {
  hero: {
    eyebrow: "Zabaganka Boutique",
    heading: "Прикраси, які стають частиною вашої історії",
    subheading: "Вишукані деталі для особливих моментів і щоденних образів",
    primary_button_label: "Перейти до каталогу",
    primary_button_href: "/store",
    secondary_button_label: "Переглянути новинки",
    secondary_button_href: "/store?sortBy=created_at",
    image_url: null,
    image_alt: "Брендове фото",
  },
  category_grid: {
    images: [],
  },
  gift_banner: {
    image_url: null,
    image_alt: "Фото пакування",
    eyebrow: "Особливий подарунок",
    heading: "Турбота відчувається ще до відкриття",
    description:
      "Оберіть оформлення, яке зробить момент вручення ще особливішим: коробку, пакет, стрічку або додаткове подарункове пакування.",
    button_label: "Обрати пакування",
    button_href: "/store",
    note: "Види та вартість пакування буде уточнено.",
  },
  why_us: {
    eyebrow: "Наш підхід",
    heading: "Чому обирають нас",
    description:
      "Від першого повідомлення до моменту, коли ви відкриваєте пакування.",
    features: [
      { id: "f1", text: "Перевіряємо кожен товар перед відправленням" },
      { id: "f2", text: "Реальні фото відповідають товару" },
      { id: "f3", text: "Допомагаємо підібрати розмір і модель" },
      { id: "f4", text: "Дбайливо пакуємо кожне замовлення" },
    ],
  },
  instagram_section: {
    eyebrow: "Instagram",
    heading: "Ближче до Zabaganka",
    description: "Новинки, деталі виробів і натхнення для ваших образів.",
    button_label: "Перейти в Instagram",
    button_href: "https://instagram.com",
    images: [
      { id: "i1", image_url: null, alt: "" },
      { id: "i2", image_url: null, alt: "" },
      { id: "i3", image_url: null, alt: "" },
    ],
  },
  cta_section: {
    eyebrow: "Потрібна допомога?",
    heading: "Підберемо прикрасу для вас або на подарунок",
    button_label: "Написати нам",
    button_href: "/contacts",
  },
}
// ---------------------------------------------------------------------------
// About page
// ---------------------------------------------------------------------------

export type PageHeroContent = {
  eyebrow: string
  heading: string
  description: string
}

export type AboutStoryContent = {
  image_url: string | null
  image_alt: string
  eyebrow: string
  heading: string
  /** Paragraphs separated by an empty line. */
  body: string
}

export type AboutStatsContent = {
  items: { id: string; value: string; label: string }[]
}

export type AboutValuesContent = {
  eyebrow: string
  heading: string
  description: string
  items: { id: string; title: string; text: string }[]
}

export type AboutProcessItem = {
  id: string
  image_url: string | null
  image_alt: string
  title: string
  text: string
}

export type AboutProcessContent = {
  eyebrow: string
  heading: string
  items: AboutProcessItem[]
}

export type AboutCtaContent = {
  eyebrow: string
  heading: string
  primary_button_label: string
  primary_button_href: string
  secondary_button_label: string
  secondary_button_href: string
}

export type AboutPageContent = {
  hero: PageHeroContent
  story: AboutStoryContent
  stats: AboutStatsContent
  values: AboutValuesContent
  process: AboutProcessContent
  cta: AboutCtaContent
}

export const ABOUT_PAGE_CONTENT_DEFAULTS: AboutPageContent = {
  hero: {
    eyebrow: "Про нас",
    heading: "Прикраси, що стають частиною вашої історії",
    description:
      "Zabaganka Boutique — український бутик прикрас і аксесуарів. Ми віримо, що навіть маленька сережка може розповісти про людину більше, ніж слова.",
  },
  story: {
    image_url: null,
    image_alt: "Команда Zabaganka Boutique за роботою",
    eyebrow: "Наша історія",
    heading:
      "Від маленької вітрини у Львові до бутика з доставкою по всій Україні",
    body: "Усе почалося у 2019 році з невеликої вітрини в центрі Львова, де ми продавали прикраси, які самі хотіли б носити. Ми довго шукали майстрів, яким можна довіряти, і вчилися відрізняти по-справжньому якісний виріб від просто красивого.\n\nСьогодні Zabaganka Boutique — це онлайн-бутик і шоурум, де зібрано срібло, золото, прикраси з натуральним камінням та аксесуари. Ми самі відбираємо кожну модель, перевіряємо її перед відправкою й пакуємо так, щоб відкривати посилку було приємно.",
  },
  stats: {
    items: [
      { id: "s1", value: "2019", label: "рік заснування" },
      { id: "s2", value: "12 000+", label: "задоволених клієнтів" },
      { id: "s3", value: "1 500+", label: "виробів у колекціях" },
      { id: "s4", value: "24", label: "області, куди ми доставляємо" },
    ],
  },
  values: {
    eyebrow: "Цінності",
    heading: "У що ми віримо",
    description:
      "Чотири принципи, яких ми тримаємося з першого дня — від вибору постачальника до моменту, коли посилка потрапляє до ваших рук.",
    items: [
      {
        id: "v1",
        title: "Якість без компромісів",
        text: "Працюємо з перевіреними українськими майстернями та постачальниками. Кожен виріб проходить огляд перед відправкою.",
      },
      {
        id: "v2",
        title: "Чесні ціни",
        text: "Без штучних знижок і прихованих націнок. Ви платите за метал, камінь і роботу майстра.",
      },
      {
        id: "v3",
        title: "Турбота після покупки",
        text: "Допоможемо з доглядом, підберемо розмір і підкажемо, як зберегти блиск прикраси на роки.",
      },
      {
        id: "v4",
        title: "Подарунок — це мистецтво",
        text: "Кожне замовлення пакуємо у фірмову коробку. За бажанням додамо листівку з вашими словами.",
      },
    ],
  },
  process: {
    eyebrow: "Зсередини",
    heading: "Як ми працюємо",
    items: [
      {
        id: "p1",
        image_url: null,
        image_alt: "Прикраси Zabaganka Boutique крупним планом",
        title: "Ретельний відбір",
        text: "У колекцію потрапляє лише кожна п'ята модель, яку ми тестуємо.",
      },
      {
        id: "p2",
        image_url: null,
        image_alt: "Фірмове пакування Zabaganka Boutique",
        title: "Фірмове пакування",
        text: "Коробка, мішечок для зберігання та листівка — вже в комплекті.",
      },
      {
        id: "p3",
        image_url: null,
        image_alt: "Вітрина бутика Zabaganka Boutique",
        title: "Шоурум у Львові",
        text: "Приміряти прикраси наживо можна за попереднім записом.",
      },
    ],
  },
  cta: {
    eyebrow: "Знайдіть свою прикрасу",
    heading: "Кожна колекція створена з любов'ю до деталей",
    primary_button_label: "Перейти до каталогу",
    primary_button_href: "/store",
    secondary_button_label: "Часті питання",
    secondary_button_href: "/faq",
  },
}

// ---------------------------------------------------------------------------
// Contacts page
// ---------------------------------------------------------------------------

export type ContactsSupportContent = {
  heading: string
  email_label: string
  email: string
  schedule_heading: string
  schedule: { id: string; days: string; hours: string }[]
}

export type ContactsSocialLink = {
  id: string
  label: string
  handle: string
  url: string
}

export type ContactsSocialContent = {
  heading: string
  description: string
  links: ContactsSocialLink[]
}

export type ContactsClosingContent = {
  text: string
}

export type ContactsPageContent = {
  hero: PageHeroContent
  support: ContactsSupportContent
  social: ContactsSocialContent
  closing: ContactsClosingContent
}

export const CONTACTS_PAGE_CONTENT_DEFAULTS: ContactsPageContent = {
  hero: {
    eyebrow: "Контакти",
    heading: "Ми завжди на зв’язку ♡",
    description:
      "Маєте запитання щодо прикрас, оформлення замовлення чи доставки? Команда Zabaganka Boutique із задоволенням допоможе вам!",
  },
  support: {
    heading: "Служба підтримки клієнтів",
    email_label: "Електронна пошта",
    email: "zabagankajewerly@gmail.com",
    schedule_heading: "Графік роботи",
    schedule: [{ id: "h1", days: "Пн–Сб", hours: "" }],
  },
  social: {
    heading: "Залишаймося на зв’язку!",
    description:
      "Слідкуйте за нашими новинками, надихайтеся стильними образами та обирайте прикраси, які підкреслюють вашу індивідуальність.",
    links: [
      {
        id: "l1",
        label: "Instagram",
        handle: "@zabaganka.boutique",
        url: "https://instagram.com/zabaganka.boutique",
      },
      {
        id: "l2",
        label: "Telegram",
        handle: "@zabaganka_boutique",
        url: "https://t.me/zabaganka_boutique",
      },
    ],
  },
  closing: {
    text: "З любов’ю до кожної деталі, Zabaganka Boutique ♡",
  },
}

// ---------------------------------------------------------------------------
// Page registry
// ---------------------------------------------------------------------------

export type PageContentMap = {
  home: HomePageContent
  about: AboutPageContent
  contacts: ContactsPageContent
}

export type PageContentKey = keyof PageContentMap

export const PAGE_CONTENT_DEFAULTS: {
  [K in PageContentKey]: PageContentMap[K]
} = {
  home: HOME_PAGE_CONTENT_DEFAULTS,
  about: ABOUT_PAGE_CONTENT_DEFAULTS,
  contacts: CONTACTS_PAGE_CONTENT_DEFAULTS,
}
