import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "./sdk"

export type PackagingVariantDTO = {
  id: string
  packaging_id: string
  length: number
  width: number
  height: number
  price: number
  image_url: string | null
  is_available: boolean
}

export type PackagingDTO = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  is_available: boolean
  variants: PackagingVariantDTO[]
}

export type PackagingInput = {
  title: string
  description: string | null
  image_url: string | null
  is_available: boolean
}

export type PackagingVariantInput = {
  length: number
  width: number
  height: number
  price: number
  image_url: string | null
  is_available: boolean
}

export type ProductPackagingDTO = {
  product_id: string
  variant_ids: string[]
}

const listKey = ["packagings"]
const detailKey = (id: string) => ["packagings", id]
const productKey = (productId: string) => ["product-packaging", productId]

export function usePackagings() {
  return useQuery({
    queryKey: listKey,
    queryFn: () =>
      sdk.client.fetch<{ packagings: PackagingDTO[] }>("/admin/packagings"),
  })
}

export function usePackaging(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    queryFn: () =>
      sdk.client.fetch<{ packaging: PackagingDTO }>(`/admin/packagings/${id}`),
    enabled: !!id,
  })
}

function useInvalidatePackagings() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: listKey })
    queryClient.invalidateQueries({ queryKey: ["product-packaging"] })
  }
}

export function useSavePackaging() {
  const invalidate = useInvalidatePackagings()

  return useMutation({
    mutationFn: ({ id, ...body }: PackagingInput & { id?: string }) =>
      sdk.client.fetch<{ packaging: PackagingDTO }>(
        id ? `/admin/packagings/${id}` : "/admin/packagings",
        { method: "POST", body }
      ),
    onSuccess: invalidate,
  })
}

export function useDeletePackaging() {
  const invalidate = useInvalidatePackagings()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/packagings/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
}

export function useSavePackagingVariant(packagingId: string) {
  const invalidate = useInvalidatePackagings()

  return useMutation({
    mutationFn: ({ id, ...body }: PackagingVariantInput & { id?: string }) =>
      sdk.client.fetch<{ variant: PackagingVariantDTO }>(
        id
          ? `/admin/packagings/${packagingId}/variants/${id}`
          : `/admin/packagings/${packagingId}/variants`,
        { method: "POST", body }
      ),
    onSuccess: invalidate,
  })
}

export function useDeletePackagingVariant(packagingId: string) {
  const invalidate = useInvalidatePackagings()

  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/packagings/${packagingId}/variants/${id}`, {
        method: "DELETE",
      }),
    onSuccess: invalidate,
  })
}

export function useProductPackaging(productId: string | undefined) {
  return useQuery({
    queryKey: productKey(productId ?? ""),
    queryFn: () =>
      sdk.client.fetch<{ packaging: ProductPackagingDTO }>(
        `/admin/products/${productId}/packaging`
      ),
    enabled: !!productId,
  })
}

export function useSaveProductPackaging(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: { variant_ids: string[] }) =>
      sdk.client.fetch<{ packaging: ProductPackagingDTO }>(
        `/admin/products/${productId}/packaging`,
        { method: "POST", body }
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(productKey(productId), data)
    },
  })
}

export function formatUah(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDimensions(variant: {
  length: number
  width: number
  height: number
}): string {
  return `${variant.length} × ${variant.width} × ${variant.height} см`
}

export const DIMENSIONS_HINT = "довжина × ширина × висота"

export function formatPriceRange(variants: PackagingVariantDTO[]): string {
  if (!variants.length) {
    return "—"
  }
  const prices = variants.map((variant) => variant.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatUah(min) : `${formatUah(min)} – ${formatUah(max)}`
}

export function packagingVariantPath(variant: {
  id: string
  packaging_id: string
}): string {
  return `/packaging/${variant.packaging_id}?variant=${variant.id}`
}

export type DefaultPackagingDTO = {
  title: string
  description: string | null
  image_url: string | null
}

const defaultKey = ["packaging-default"]

export function useDefaultPackaging() {
  return useQuery({
    queryKey: defaultKey,
    queryFn: () =>
      sdk.client.fetch<{ default_packaging: DefaultPackagingDTO }>(
        "/admin/packaging-default"
      ),
  })
}

export function useSaveDefaultPackaging() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: DefaultPackagingDTO) =>
      sdk.client.fetch<{ default_packaging: DefaultPackagingDTO }>(
        "/admin/packaging-default",
        { method: "POST", body }
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(defaultKey, data)
    },
  })
}

export function variantImage(
  variant: { image_url: string | null },
  packaging: { image_url: string | null }
): string | null {
  return variant.image_url || packaging.image_url || null
}
