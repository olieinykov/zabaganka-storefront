import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { PackagingData } from "@lib/util/packaging"
import { ProductMediaItem } from "@lib/util/product-videos"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  media: ProductMediaItem[]
  selectedVariantId?: string
  packaging: PackagingData
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  media,
  selectedVariantId,
  packaging,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/*
        < 768px: single column (info, gallery, actions), capped at 560px of
        content so the image does not stretch to the full tablet width.
        768px..large: two columns - gallery on the left, info, actions and
        tabs stacked on the right, so the image stays next to the title
        instead of being squeezed between two 300px side columns. The right
        column is 300px on tablets and 380px from small up.
        large+: three columns (info + tabs, gallery, actions).
      */}
      <div
        className="content-container relative flex flex-col py-6 max-[767px]:max-w-[608px] min-[768px]:grid min-[768px]:grid-cols-[minmax(0,560px)_300px] min-[768px]:grid-rows-[auto_auto_1fr] min-[768px]:items-start min-[768px]:justify-center min-[768px]:gap-x-8 min-[768px]:gap-y-8 small:grid-cols-[minmax(0,600px)_380px] small:gap-x-12 large:grid-cols-[300px_minmax(0,1fr)_300px] large:grid-rows-[auto] large:gap-0"
        data-testid="product-container"
      >
        <div className="flex w-full flex-col gap-y-6 py-8 min-[768px]:contents large:sticky large:top-48 large:col-start-1 large:row-start-1 large:flex large:py-0">
          <div className="min-[768px]:col-start-2 min-[768px]:row-start-1">
            <ProductInfo product={product} />
          </div>
          <div className="min-[768px]:col-start-2 min-[768px]:row-start-3">
            <ProductTabs product={product} />
          </div>
        </div>
        <div className="relative block w-full min-[768px]:sticky min-[768px]:top-36 min-[768px]:col-start-1 min-[768px]:row-span-3 min-[768px]:row-start-1 large:static large:col-start-2 large:row-span-1">
          <ImageGallery media={media} />
        </div>
        <div className="flex w-full flex-col gap-y-12 py-8 min-[768px]:col-start-2 min-[768px]:row-start-2 min-[768px]:py-0 large:sticky large:top-48 large:col-start-3 large:row-start-1">
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
                initialVariantId={selectedVariantId}
                packagingOptions={packaging.byProduct[product.id] ?? []}
                defaultPackaging={packaging.defaultPackaging}
              />
            }
          >
            <ProductActionsWrapper
              id={product.id}
              region={region}
              initialVariantId={selectedVariantId}
              packaging={packaging}
            />
          </Suspense>
        </div>
      </div>
      <div
        className="content-container mt-8 mb-16 small:mt-12 small:mb-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate