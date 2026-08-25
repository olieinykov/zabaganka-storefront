import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

export type PageContentBlockDTO = {
  page: string
  block_key: string
  content: Record<string, any>
  updated_at: string | null
  is_customized: boolean
}

const queryKey = (page: string) => ["page-content", page]

export function usePageContentBlocks(page: string) {
  return useQuery({
    queryKey: queryKey(page),
    queryFn: () =>
      sdk.client
        .fetch<{ page: string; blocks: PageContentBlockDTO[] }>(
          `/admin/page-content`,
          { query: { page } }
        )
        .then((res) => res.blocks),
  })
}

export function useSavePageContentBlock(page: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      block_key,
      content,
    }: {
      block_key: string
      content: Record<string, any>
    }) =>
      sdk.client.fetch<{ block: PageContentBlockDTO }>(
        `/admin/page-content/${block_key}`,
        {
          method: "POST",
          query: { page },
          body: content,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(page) })
    },
  })
}

export type CategoryGridCategoryDTO = {
  category_id: string
  name: string
  image_url: string | null
  image_alt: string
}

export function useCategoryGridCategories(page: string) {
  return useQuery({
    queryKey: ["page-content", page, "category-grid-categories"],
    queryFn: () =>
      sdk.client
        .fetch<{ categories: CategoryGridCategoryDTO[] }>(
          `/admin/page-content/category-grid/categories`,
          { query: { page } }
        )
        .then((res) => res.categories),
  })
}