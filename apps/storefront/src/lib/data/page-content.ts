"use server"

import { sdk } from "@lib/config"
import {
  PAGE_CONTENT_DEFAULTS,
  PageContentKey,
  PageContentMap,
} from "./page-content-types"

/**
 * Fetches editable content for a page from `/store/page-content`.
 * Tagged `page-content-${page}` so admin saves can invalidate it instantly
 * via `/api/revalidate` (see backend's page-content API route); otherwise it
 * revalidates on the normal ISR window below.
 *
 * Falls back to hardcoded defaults on any error so a page never breaks
 * because of a CMS/backend hiccup.
 */
export async function getPageContent<P extends PageContentKey>(
  page: P
): Promise<PageContentMap[P]> {
  const defaults = PAGE_CONTENT_DEFAULTS[page]

  try {
    const res = await sdk.client.fetch<{
      page: string
      blocks: Record<string, unknown>
    }>("/store/page-content", {
      method: "GET",
      query: { page },
      next: { tags: [`page-content-${page}`], revalidate: 300 },
      cache: "no-cache",
    })

    return {
      ...defaults,
      ...(res.blocks as Partial<PageContentMap[P]>),
    }
  } catch {
    return defaults
  }
}
