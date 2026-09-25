import { Metadata } from "next"
import { notFound } from "next/navigation"
import { COUNTRY_CODE } from "@lib/constants"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getDefaultVariant } from "@lib/util/product"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const { response } = await listProducts({
      countryCode: COUNTRY_CODE,
      queryParams: { limit: 100, fields: "handle" },
    })

    return response.products
      .map((product) => ({ handle: product.handle }))
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct | undefined | null,
  selectedVariantId?: string
) {
  if (!product) {
    return []
  }

  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants!.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return product.images
  }

  const imageIdsMap = new Map(variant.images!.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle } = await props.params
  const region = await getRegion(COUNTRY_CODE)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode: COUNTRY_CODE,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  return {
    title: `${product.title} | Zabaganka Boutique`,
    description: `${product.title}`,
    openGraph: {
      title: `${product.title} | Zabaganka Boutique`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(COUNTRY_CODE)
  const searchParams = await props.searchParams

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: COUNTRY_CODE,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const selectedVariantId =
    (searchParams.v_id &&
      pricedProduct.variants?.some((v) => v.id === searchParams.v_id) &&
      searchParams.v_id) ||
    getDefaultVariant(pricedProduct)?.id

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={COUNTRY_CODE}
      images={images ?? []}
      selectedVariantId={selectedVariantId}
    />
  )
}