import { z } from "@medusajs/framework/zod"


// ---------------------------------------------------------------------------
// Home page blocks
// ---------------------------------------------------------------------------

export const HOME_BLOCK_KEYS = [
  "hero",
  "category_grid",
  "gift_banner",
  "why_us",
  "instagram_section",
  "cta_section",
] as const

export type HomeBlockKey = (typeof HOME_BLOCK_KEYS)[number]

const featureItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1, "Текст пункту обов'язковий"),
})

const instagramImageSchema = z.object({
  id: z.string().min(1),
  image_url: z.string().url().nullable().default(null),
  alt: z.string().default(""),
})

export const heroContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  subheading: z.string().default(""),
  primary_button_label: z.string().default(""),
  primary_button_href: z.string().default(""),
  secondary_button_label: z.string().default(""),
  secondary_button_href: z.string().default(""),
  image_url: z.string().url().nullable().default(null),
  image_alt: z.string().default(""),
})

export const categoryGridImageSchema = z.object({
  category_id: z.string().min(1),
  image_url: z.string().url().nullable().default(null),
  image_alt: z.string().default(""),
})

export const categoryGridContentSchema = z.object({
  images: z.array(categoryGridImageSchema).default([]),
})

export const giftBannerContentSchema = z.object({
  image_url: z.string().url().nullable().default(null),
  image_alt: z.string().default(""),
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().default(""),
  button_label: z.string().default(""),
  button_href: z.string().default(""),
  note: z.string().default(""),
})

export const whyUsContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().default(""),
  features: z.array(featureItemSchema).default([]),
})

export const instagramSectionContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().default(""),
  button_label: z.string().default(""),
  button_href: z.string().default(""),
  images: z.array(instagramImageSchema).default([]),
})

export const ctaSectionContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  button_label: z.string().default(""),
  button_href: z.string().default(""),
})

export type HeroContent = z.infer<typeof heroContentSchema>
export type CategoryGridContent = z.infer<typeof categoryGridContentSchema>
export type GiftBannerContent = z.infer<typeof giftBannerContentSchema>
export type WhyUsContent = z.infer<typeof whyUsContentSchema>
export type InstagramSectionContent = z.infer<
  typeof instagramSectionContentSchema
>
export type CtaSectionContent = z.infer<typeof ctaSectionContentSchema>

type HomeBlockContentMap = {
  hero: HeroContent
  category_grid: CategoryGridContent
  gift_banner: GiftBannerContent
  why_us: WhyUsContent
  instagram_section: InstagramSectionContent
  cta_section: CtaSectionContent
}

export type HomeBlockContent<K extends HomeBlockKey = HomeBlockKey> =
  HomeBlockContentMap[K]

type AnyBlockDefinition = {
  label: string
  schema: z.ZodType<Record<string, unknown>>
  defaultContent: Record<string, unknown>
}

type BlockDefinition<K extends HomeBlockKey> = {
  label: string
  schema: z.ZodType<HomeBlockContentMap[K]>
  defaultContent: HomeBlockContentMap[K]
}

export const HOME_BLOCK_DEFINITIONS: {
  [K in HomeBlockKey]: BlockDefinition<K>
} = {
  hero: {
    label: "Hero",
    schema: heroContentSchema,
    defaultContent: {
      eyebrow: "Zabaganka Boutique",
      heading: "Прикраси, які стають частиною вашої історії",
      subheading:
        "Вишукані деталі для особливих моментів і щоденних образів",
      primary_button_label: "Перейти до каталогу",
      primary_button_href: "/store",
      secondary_button_label: "Переглянути новинки",
      secondary_button_href: "/store?sortBy=created_at",
      image_url: null,
      image_alt: "Брендове фото",
    },
  },
  category_grid: {
    label: "Category Grid",
    schema: categoryGridContentSchema,
    defaultContent: {
      images: [],
    },
  },
  gift_banner: {
    label: "Gift Banner",
    schema: giftBannerContentSchema,
    defaultContent: {
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
  },
  why_us: {
    label: "Why Us",
    schema: whyUsContentSchema,
    defaultContent: {
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
  },
  instagram_section: {
    label: "Instagram",
    schema: instagramSectionContentSchema,
    defaultContent: {
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
  },
  cta_section: {
    label: "CTA",
    schema: ctaSectionContentSchema,
    defaultContent: {
      eyebrow: "Потрібна допомога?",
      heading: "Підберемо прикрасу для вас або на подарунок",
      button_label: "Написати нам",
      button_href: "/contacts",
    },
  },
}

// ---------------------------------------------------------------------------
// About page blocks
// ---------------------------------------------------------------------------

export const ABOUT_BLOCK_KEYS = [
  "hero",
  "story",
  "stats",
  "values",
  "process",
  "cta",
] as const

export type AboutBlockKey = (typeof ABOUT_BLOCK_KEYS)[number]

const imageUrlSchema = z.string().url().nullable().default(null)

export const pageHeroContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().default(""),
})

export const aboutStoryContentSchema = z.object({
  image_url: imageUrlSchema,
  image_alt: z.string().default(""),
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  // Paragraphs are separated by an empty line.
  body: z.string().default(""),
})

export const aboutStatsContentSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        value: z.string().min(1, "Значення обов'язкове"),
        label: z.string().default(""),
      })
    )
    .default([]),
})

export const aboutValuesContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  description: z.string().default(""),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1, "Назва обов'язкова"),
        text: z.string().default(""),
      })
    )
    .default([]),
})

export const aboutProcessContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        image_url: imageUrlSchema,
        image_alt: z.string().default(""),
        title: z.string().min(1, "Назва обов'язкова"),
        text: z.string().default(""),
      })
    )
    .default([]),
})

export const aboutCtaContentSchema = z.object({
  eyebrow: z.string().default(""),
  heading: z.string().min(1, "Заголовок обов'язковий"),
  primary_button_label: z.string().default(""),
  primary_button_href: z.string().default(""),
  secondary_button_label: z.string().default(""),
  secondary_button_href: z.string().default(""),
})

export const ABOUT_BLOCK_DEFINITIONS = {
  hero: {
    label: "Hero",
    schema: pageHeroContentSchema,
    defaultContent: {
      eyebrow: "Про нас",
      heading: "Прикраси, що стають частиною вашої історії",
      description:
        "Zabaganka Boutique — український бутик прикрас і аксесуарів. Ми віримо, що навіть маленька сережка може розповісти про людину більше, ніж слова.",
    },
  },
  story: {
    label: "Наша історія",
    schema: aboutStoryContentSchema,
    defaultContent: {
      image_url: null,
      image_alt: "Команда Zabaganka Boutique за роботою",
      eyebrow: "Наша історія",
      heading:
        "Від маленької вітрини у Львові до бутика з доставкою по всій Україні",
      body: "Усе почалося у 2019 році з невеликої вітрини в центрі Львова, де ми продавали прикраси, які самі хотіли б носити. Ми довго шукали майстрів, яким можна довіряти, і вчилися відрізняти по-справжньому якісний виріб від просто красивого.\n\nСьогодні Zabaganka Boutique — це онлайн-бутик і шоурум, де зібрано срібло, золото, прикраси з натуральним камінням та аксесуари. Ми самі відбираємо кожну модель, перевіряємо її перед відправкою й пакуємо так, щоб відкривати посилку було приємно.",
    },
  },
  stats: {
    label: "Цифри",
    schema: aboutStatsContentSchema,
    defaultContent: {
      items: [
        { id: "s1", value: "2019", label: "рік заснування" },
        { id: "s2", value: "12 000+", label: "задоволених клієнтів" },
        { id: "s3", value: "1 500+", label: "виробів у колекціях" },
        { id: "s4", value: "24", label: "області, куди ми доставляємо" },
      ],
    },
  },
  values: {
    label: "Цінності",
    schema: aboutValuesContentSchema,
    defaultContent: {
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
  },
  process: {
    label: "Як ми працюємо",
    schema: aboutProcessContentSchema,
    defaultContent: {
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
  },
  cta: {
    label: "CTA",
    schema: aboutCtaContentSchema,
    defaultContent: {
      eyebrow: "Знайдіть свою прикрасу",
      heading: "Кожна колекція створена з любов'ю до деталей",
      primary_button_label: "Перейти до каталогу",
      primary_button_href: "/store",
      secondary_button_label: "Часті питання",
      secondary_button_href: "/faq",
    },
  },
} satisfies Record<AboutBlockKey, AnyBlockDefinition>

// ---------------------------------------------------------------------------
// Contacts page blocks
// ---------------------------------------------------------------------------

export const CONTACTS_BLOCK_KEYS = [
  "hero",
  "support",
  "social",
  "closing",
] as const

export type ContactsBlockKey = (typeof CONTACTS_BLOCK_KEYS)[number]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const contactsSupportContentSchema = z.object({
  heading: z.string().default(""),
  email_label: z.string().default(""),
  email: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || EMAIL_PATTERN.test(v), {
      message: "Некоректна адреса електронної пошти",
    }),
  schedule_heading: z.string().default(""),
  schedule: z
    .array(
      z.object({
        id: z.string().min(1),
        days: z.string().default(""),
        hours: z.string().default(""),
      })
    )
    .default([]),
})

export const contactsSocialContentSchema = z.object({
  heading: z.string().default(""),
  description: z.string().default(""),
  links: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1, "Назва мережі обов'язкова"),
        handle: z.string().default(""),
        url: z.string().default(""),
      })
    )
    .default([]),
})

export const contactsClosingContentSchema = z.object({
  text: z.string().default(""),
})

export const CONTACTS_BLOCK_DEFINITIONS = {
  hero: {
    label: "Hero",
    schema: pageHeroContentSchema,
    defaultContent: {
      eyebrow: "Контакти",
      heading: "Ми завжди на зв’язку ♡",
      description:
        "Маєте запитання щодо прикрас, оформлення замовлення чи доставки? Команда Zabaganka Boutique із задоволенням допоможе вам!",
    },
  },
  support: {
    label: "Служба підтримки",
    schema: contactsSupportContentSchema,
    defaultContent: {
      heading: "Служба підтримки клієнтів",
      email_label: "Електронна пошта",
      email: "zabagankajewerly@gmail.com",
      schedule_heading: "Графік роботи",
      schedule: [{ id: "h1", days: "Пн–Сб", hours: "" }],
    },
  },
  social: {
    label: "Соцмережі",
    schema: contactsSocialContentSchema,
    defaultContent: {
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
  },
  closing: {
    label: "Підпис",
    schema: contactsClosingContentSchema,
    defaultContent: {
      text: "З любов’ю до кожної деталі, Zabaganka Boutique ♡",
    },
  },
} satisfies Record<ContactsBlockKey, AnyBlockDefinition>

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export const PAGE_BLOCKS = {
  home: HOME_BLOCK_KEYS,
  about: ABOUT_BLOCK_KEYS,
  contacts: CONTACTS_BLOCK_KEYS,
} as const

export type PageKey = keyof typeof PAGE_BLOCKS

export type BlockKey = HomeBlockKey | AboutBlockKey | ContactsBlockKey

const PAGE_BLOCK_DEFINITIONS: Record<
  PageKey,
  Record<string, AnyBlockDefinition>
> = {
  home: HOME_BLOCK_DEFINITIONS,
  about: ABOUT_BLOCK_DEFINITIONS,
  contacts: CONTACTS_BLOCK_DEFINITIONS,
}

export function isValidPage(page: string): page is PageKey {
  return Object.prototype.hasOwnProperty.call(PAGE_BLOCKS, page)
}

export function isValidBlockKey(
  page: PageKey,
  blockKey: string
): blockKey is BlockKey {
  return (PAGE_BLOCKS[page] as readonly string[]).includes(blockKey)
}

export function getBlockSchema(page: PageKey, blockKey: BlockKey) {
  return PAGE_BLOCK_DEFINITIONS[page][blockKey].schema
}

export function getBlockDefault(
  page: PageKey,
  blockKey: BlockKey
): Record<string, unknown> {
  return PAGE_BLOCK_DEFINITIONS[page][blockKey].defaultContent
}