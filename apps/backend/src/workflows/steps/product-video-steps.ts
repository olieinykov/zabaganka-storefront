import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PRODUCT_MEDIA_MODULE } from "../../modules/product-media"
import ProductMediaModuleService from "../../modules/product-media/service"

export type ProductVideoRecord = {
  id: string
  url: string
  file_id: string
  mime_type: string | null
  rank: number
}

export type CreateProductVideoData = Omit<ProductVideoRecord, "id">

type ProductWithVideos = {
  id: string
  product_video_files?: (ProductVideoRecord | null)[] | null
}

export const getProductVideosStep = createStep(
  "get-product-videos",
  async (input: { product_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "product_video_files.id",
        "product_video_files.url",
        "product_video_files.file_id",
        "product_video_files.mime_type",
        "product_video_files.rank",
      ],
      filters: { id: input.product_id },
    })

    const product = data[0] as unknown as ProductWithVideos | undefined
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id "${input.product_id}" was not found`
      )
    }

    const videos = (product.product_video_files ?? [])
      .filter((video): video is ProductVideoRecord => !!video)
      .sort((a, b) => a.rank - b.rank)

    return new StepResponse(videos)
  }
)

export const getProductImageCountStep = createStep(
  "get-product-image-count",
  async (input: { product_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "images.id"],
      filters: { id: input.product_id },
    })

    return new StepResponse(data[0]?.images?.length ?? 0)
  }
)

export const createProductVideosStep = createStep(
  "create-product-videos",
  async (data: CreateProductVideoData[], { container }) => {
    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)

    const videos = await service.createProductVideoFiles(data)

    return new StepResponse(
      videos,
      videos.map((video) => video.id)
    )
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)
    await service.deleteProductVideoFiles(ids)
  }
)

export const softDeleteProductVideosStep = createStep(
  "soft-delete-product-videos",
  async (ids: string[], { container }) => {
    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)

    await service.softDeleteProductVideoFiles(ids)

    return new StepResponse(ids, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }

    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)
    await service.restoreProductVideoFiles(ids)
  }
)

export const updateProductVideoRanksStep = createStep(
  "update-product-video-ranks",
  async (
    input: {
      ranks: { id: string; rank: number }[]
      previous: { id: string; rank: number }[]
    },
    { container }
  ) => {
    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)

    const videos = await service.updateProductVideoFiles(input.ranks)

    return new StepResponse(videos, input.previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }

    const service: ProductMediaModuleService =
      container.resolve(PRODUCT_MEDIA_MODULE)
    await service.updateProductVideoFiles(previous)
  }
)
