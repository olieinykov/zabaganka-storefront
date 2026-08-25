"use server"

import { sdk } from "@lib/config"
import {
  HOME_PAGE_CONTENT_DEFAULTS,
  HomePageContent,
} from "./page-content-types"

/**
 * Fetches editable content for a page from `/store/page-content`.
 * Tagged `page-content-${page}` so admin saves can invalidate it instantly
 * via `/api/revalidate` (see backend's page-content API route); otherwise it
 * revalidates on the normal ISR window below.
 *
 * Falls back to hardcoded defaults on any error so the home page never
 * breaks because of a CMS/backend hiccup.
 */
export async function getPageContent(
  page: "home" = "home"
): Promise<HomePageContent> {
  try {
    const res = await sdk.client.fetch<{
      page: string
      blocks: Record<string, unknown>
    }>("/store/page-content", {
      method: "GET",
      query: { page },
      next: { tags: [`page-content-${page}`], revalidate: 300 },
      cache: "force-cache",
    })

    return {
      ...HOME_PAGE_CONTENT_DEFAULTS,
      ...(res.blocks as Partial<HomePageContent>),
    }
  } catch {
    return HOME_PAGE_CONTENT_DEFAULTS
  }
}
