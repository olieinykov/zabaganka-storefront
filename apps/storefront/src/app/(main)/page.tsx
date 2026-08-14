import { Metadata } from "next"

import { COUNTRY_CODE } from "@lib/constants"
import CategoryGrid from "@modules/home/components/category-grid"
import CtaSection from "@modules/home/components/cta-section"
import GiftBanner from "@modules/home/components/gift-banner"
import Hero from "@modules/home/components/hero"
import InstagramSection from "@modules/home/components/instagram-section"
import ProductSection from "@modules/home/components/product-section"
import Testimonials from "@modules/home/components/testimonials"
import WhyUs from "@modules/home/components/why-us"

export const metadata: Metadata = {
  title: "Zabaganka Boutique — прикраси та аксесуари",
  description:
    "Zabaganka Boutique — прикраси, які стають частиною вашої історії. Сережки, каблучки, кольє та сумки з доставкою по Україні.",
}

export default async function Home() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <ProductSection
        eyebrow="Щойно додано"
        title="Новинки"
        linkHref="/store?sortBy=created_at"
        linkLabel="Переглянути всі"
        badge="Новинка"
        countryCode={COUNTRY_CODE}
        sortBy="-created_at"
      />
      <GiftBanner />
      <ProductSection
        eyebrow="Вибір покупців"
        title="Популярні вироби"
        linkHref="/store"
        linkLabel="Дивитися більше"
        countryCode={COUNTRY_CODE}
      />
      <WhyUs />
      <Testimonials />
      <InstagramSection />
      <CtaSection />
    </>
  )
}
