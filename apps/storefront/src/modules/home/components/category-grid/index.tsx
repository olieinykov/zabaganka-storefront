import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryShape, { shapeForIndex } from "@modules/common/icons/category-shape"
import SectionHeading from "@modules/home/components/section-heading"

export default async function CategoryGrid() {
  const categories = (await listCategories().catch(() => [])) || []
  const topLevel = categories.filter((c) => !c.parent_category).slice(0, 4)

  if (!topLevel.length) {
    return null
  }

  return (
    <section className="content-container py-16 small:py-24">
      <SectionHeading
        eyebrow="Каталог"
        title="Знайдіть свою деталь"
        linkHref="/store"
        linkLabel="Усі категорії"
      />
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-5">
        {topLevel.map((category, index) => (
          <LocalizedClientLink
            key={category.id}
            href={`/categories/${category.handle}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[4/5] bg-sand overflow-hidden flex items-center justify-center interactive group-hover:opacity-90">
              
              <CategoryShape
                shape={shapeForIndex(index)}
                size={56}
                color="#8a7a63"
              />
              
              {/* Плавающая плашка с текстом */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white border border-line px-3 py-2 sm:px-4 sm:py-3">
                <span className="font-display text-base sm:text-lg text-navy block truncate">
                  {category.name}
                </span>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-graphite mt-0.5">
                  Переглянути колекцію
                </p>
              </div>

            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}