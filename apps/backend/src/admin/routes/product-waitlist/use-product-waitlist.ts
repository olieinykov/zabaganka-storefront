import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

export type WaitlistEntryDTO = {
  id: string
  product_id: string
  product_handle: string
  product_title: string
  product_thumbnail: string | null
  variant_id: string | null
  variant_title: string | null
  contact_method: "email" | "phone"
  contact_value: string
  email: string | null
  phone: string | null
  is_archived: boolean
  archived_at: string | null
  notified_at: string | null
  notify_error: string | null
  created_at: string
  updated_at: string
  /** Set only once archived: "manual" = closed by a manager, "product_deleted"
   * / "variant_deleted" = closed automatically because the item it was
   * waiting on was removed. Null while the entry is active. */
  closed_reason: "manual" | "product_deleted" | "variant_deleted" | null
  /** false when the product/variant behind this entry no longer exists -
   * in that case the fields above fall back to the snapshot taken when the
   * entry was submitted, since there's nothing live left to read. */
  product_exists: boolean
  variant_exists: boolean
}

export type WaitlistProductGroupDTO = {
  product_id: string
  product_title: string
  product_thumbnail: string | null
  product_exists: boolean
  total_count: number
  variants: { variant_id: string; variant_title: string | null; count: number }[]
}

export type WaitlistFilters = {
  product_id?: string
  variant_id?: string
  contact_method?: "email" | "phone" | ""
  order?: "date_desc" | "date_asc"
  closed_by?: "all" | "manual" | "auto"
  limit?: number
  offset?: number
  q?: string
}

const cleanQuery = (filters: WaitlistFilters) => {
  const query: Record<string, string | number> = {}
  if (filters.product_id) query.product_id = filters.product_id
  if (filters.variant_id) query.variant_id = filters.variant_id
  if (filters.contact_method) query.contact_method = filters.contact_method
  if (filters.order) query.order = filters.order
  if (filters.closed_by && filters.closed_by !== "all") {
    query.closed_by = filters.closed_by
  }
  if (filters.q) query.q = filters.q
  query.limit = filters.limit ?? 20
  query.offset = filters.offset ?? 0
  return query
}

export function useWaitlistEntries(filters: WaitlistFilters) {
  return useQuery({
    queryKey: ["product-waitlist", "active", filters],
    queryFn: () =>
      sdk.client.fetch<{ entries: WaitlistEntryDTO[]; count: number }>(
        "/admin/product-waitlist",
        { query: cleanQuery(filters) }
      ),
  })
}

export function useArchivedWaitlistEntries(filters: WaitlistFilters) {
  return useQuery({
    queryKey: ["product-waitlist", "archived", filters],
    queryFn: () =>
      sdk.client.fetch<{ entries: WaitlistEntryDTO[]; count: number }>(
        "/admin/product-waitlist/archived",
        { query: cleanQuery(filters) }
      ),
  })
}

export function useWaitlistEntry(id: string | undefined) {
  return useQuery({
    queryKey: ["product-waitlist", "entry", id],
    queryFn: () =>
      sdk.client.fetch<{ entry: WaitlistEntryDTO; storefront_url: string }>(
        `/admin/product-waitlist/${id}`
      ),
    enabled: !!id,
  })
}

export function useNotifyWaitlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<{ entry: WaitlistEntryDTO; sent: boolean; message?: string }>(
        `/admin/product-waitlist/${id}/notify`,
        { method: "POST" }
      ),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "entry", id] })
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "active"] })
    },
  })
}

export function useCloseWaitlistEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch<{ entry: WaitlistEntryDTO }>(
        `/admin/product-waitlist/${id}/close`,
        { method: "POST" }
      ),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "entry", id] })
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "active"] })
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "archived"] })
      queryClient.invalidateQueries({ queryKey: ["product-waitlist", "products"] })
    },
  })
}

export function useWaitlistProducts(filters: { q?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["product-waitlist", "products", filters],
    queryFn: () =>
      sdk.client.fetch<{ products: WaitlistProductGroupDTO[]; count: number }>(
        "/admin/product-waitlist/products",
        {
          query: {
            ...(filters.q ? { q: filters.q } : {}),
            limit: filters.limit ?? 20,
            offset: filters.offset ?? 0,
          },
        }
      ),
  })
}

export function useWaitlistProductDetail(productId: string | undefined) {
  return useQuery({
    queryKey: ["product-waitlist", "product-detail", productId],
    queryFn: () =>
      sdk.client.fetch<{
        product: any
        total_count: number
        variants: { variant_id: string; variant_title: string | null; count: number }[]
      }>(`/admin/product-waitlist/products/${productId}`),
    enabled: !!productId,
  })
}