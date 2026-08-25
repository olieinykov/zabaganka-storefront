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