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
// Pages
// ---------------------------------------------------------------------------

export const PAGE_BLOCKS = {
  home: HOME_BLOCK_KEYS,
} as const

export type PageKey = keyof typeof PAGE_BLOCKS

export function isValidPage(page: string): page is PageKey {
  return Object.prototype.hasOwnProperty.call(PAGE_BLOCKS, page)
}

export function isValidBlockKey(
  page: PageKey,
  blockKey: string
): blockKey is HomeBlockKey {
  return (PAGE_BLOCKS[page] as readonly string[]).includes(blockKey)
}

export function getBlockSchema(blockKey: HomeBlockKey) {
  return HOME_BLOCK_DEFINITIONS[blockKey].schema
}

export function getBlockDefault(blockKey: HomeBlockKey) {
  return HOME_BLOCK_DEFINITIONS[blockKey].defaultContent
}