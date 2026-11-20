import type { BlockFormConfig } from "./config-block-form"

const pageHero = (description: string): BlockFormConfig => ({
  title: "Hero",
  description,
  fields: [
    { key: "eyebrow", label: "Наднапис (eyebrow)", type: "text" },
    { key: "heading", label: "Заголовок", type: "textarea", rows: 2 },
    { key: "description", label: "Опис", type: "textarea", rows: 3 },
  ],
})

export const ABOUT_BLOCK_CONFIGS: Record<string, BlockFormConfig> = {
  hero: pageHero("Темний банер угорі сторінки «Про нас»."),
  story: {
    title: "Наша історія",
    description: "Фото та текст під банером.",
    fields: [
      { key: "image_url", label: "Фото (вертикальне, 3:4)", type: "image" },
      { key: "image_alt", label: "Alt-текст фото", type: "text" },
      { key: "eyebrow", label: "Наднапис (eyebrow)", type: "text" },
      { key: "heading", label: "Заголовок", type: "textarea", rows: 2 },
      {
        key: "body",
        label: "Текст",
        type: "textarea",
        rows: 8,
        hint: "Абзаци розділяйте порожнім рядком.",
      },
    ],
  },
  stats: {
    title: "Цифри",
    description: "Смуга з показниками під історією.",
    fields: [
      {
        key: "items",
        label: "Показники",
        type: "list",
        itemLabel: "Показник",
        addLabel: "Додати показник",
        newItem: () => ({ value: "", label: "" }),
        fields: [
          {
            key: "value",
            label: "Значення",
            type: "text",
            placeholder: "12 000+",
          },
          {
            key: "label",
            label: "Підпис",
            type: "text",
            placeholder: "задоволених клієнтів",
          },
        ],
      },
    ],
  },
  values: {
    title: "Цінності",
    description: "Темний блок зі списком принципів.",
    fields: [
      { key: "eyebrow", label: "Наднапис (eyebrow)", type: "text" },
      { key: "heading", label: "Заголовок", type: "text" },
      { key: "description", label: "Опис", type: "textarea", rows: 3 },
      {
        key: "items",
        label: "Принципи",
        type: "list",
        itemLabel: "Принцип",
        addLabel: "Додати принцип",
        newItem: () => ({ title: "", text: "" }),
        fields: [
          { key: "title", label: "Назва", type: "text" },
          { key: "text", label: "Текст", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  process: {
    title: "Як ми працюємо",
    description: "Картки з фото (горизонтальні, 4:3).",
    fields: [
      { key: "eyebrow", label: "Наднапис (eyebrow)", type: "text" },
      { key: "heading", label: "Заголовок", type: "text" },
      {
        key: "items",
        label: "Картки",
        type: "list",
        itemLabel: "Картка",
        addLabel: "Додати картку",
        newItem: () => ({ image_url: null, image_alt: "", title: "", text: "" }),
        fields: [
          { key: "image_url", label: "Фото", type: "image" },
          { key: "image_alt", label: "Alt-текст фото", type: "text" },
          { key: "title", label: "Назва", type: "text" },
          { key: "text", label: "Текст", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  cta: {
    title: "CTA",
    description: "Заклик до дії внизу сторінки.",
    fields: [
      { key: "eyebrow", label: "Наднапис (eyebrow)", type: "text" },
      { key: "heading", label: "Заголовок", type: "textarea", rows: 2 },
      {
        key: "primary_button_label",
        label: "Текст основної кнопки",
        type: "text",
      },
      {
        key: "primary_button_href",
        label: "Посилання основної кнопки",
        type: "text",
        placeholder: "/store",
      },
      {
        key: "secondary_button_label",
        label: "Текст другого посилання",
        type: "text",
      },
      {
        key: "secondary_button_href",
        label: "Друге посилання",
        type: "text",
        placeholder: "/faq",
      },
    ],
  },
}

export const CONTACTS_BLOCK_CONFIGS: Record<string, BlockFormConfig> = {
  hero: pageHero("Темний банер угорі сторінки «Контакти»."),
  support: {
    title: "Служба підтримки",
    description:
      "Пошта відкривається в поштовому клієнті покупця. Порожні поля на сайті не показуються.",
    fields: [
      { key: "heading", label: "Заголовок", type: "text" },
      { key: "email_label", label: "Підпис до пошти", type: "text" },
      {
        key: "email",
        label: "Електронна пошта",
        type: "email",
        placeholder: "support@example.com",
      },
      { key: "schedule_heading", label: "Заголовок графіка", type: "text" },
      {
        key: "schedule",
        label: "Графік роботи",
        type: "list",
        itemLabel: "Рядок",
        addLabel: "Додати рядок",
        newItem: () => ({ days: "", hours: "" }),
        fields: [
          { key: "days", label: "Дні", type: "text", placeholder: "Пн–Сб" },
          {
            key: "hours",
            label: "Години",
            type: "text",
            placeholder: "10:00–19:00",
          },
        ],
      },
    ],
  },
  social: {
    title: "Соцмережі",
    fields: [
      { key: "heading", label: "Заголовок", type: "text" },
      { key: "description", label: "Опис", type: "textarea", rows: 3 },
      {
        key: "links",
        label: "Способи зв'язку",
        type: "list",
        itemLabel: "Спосіб зв'язку",
        addLabel: "Додати спосіб зв'язку",
        newItem: () => ({ label: "", handle: "", url: "" }),
        fields: [
          {
            key: "label",
            label: "Назва",
            type: "text",
            placeholder: "Instagram",
          },
          {
            key: "handle",
            label: "Нікнейм",
            type: "text",
            placeholder: "@zabaganka.boutique",
          },
          {
            key: "url",
            label: "Посилання",
            type: "text",
            placeholder: "https://instagram.com/zabaganka.boutique",
          },
        ],
      },
    ],
  },
  closing: {
    title: "Підпис",
    description: "Рядок наприкінці сторінки.",
    fields: [{ key: "text", label: "Текст", type: "textarea", rows: 2 }],
  },
}
