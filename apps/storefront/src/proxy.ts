import { NextRequest, NextResponse } from "next/server"

const CACHE_ID_COOKIE_NAME = "_medusa_cache_id"
const CACHE_ID_COOKIE_MAX_AGE = 60 * 60 * 24 // 1 day

/*
 * Every fetch cache tag used across `lib/data/*` (see `getCacheTag` /
 * `getCacheOptions` in `lib/data/cookies.ts`) is derived from the
 * `_medusa_cache_id` cookie. Without this middleware nothing ever sets that
 * cookie, so `getCacheTag()` always returns `""`, `getCacheOptions()` always
 * returns `{}` (no tags attached to the fetch), and every subsequent
 * `revalidateTag(...)` call (after setting an address, a shipping method,
 * etc.) becomes a no-op — pages keep serving whatever was cached on the
 * first `force-cache` request, ignoring later mutations.
 *
 * This mirrors the cache-id handling from the upstream Medusa Next.js
 * starter, minus the `[countryCode]` region-routing logic, since this store
 * only ever operates in a single region (see `COUNTRY_CODE` in
 * `lib/constants.tsx`).
 *
 */
export async function proxy(request: NextRequest) {
  const cacheIdCookie = request.cookies.get(CACHE_ID_COOKIE_NAME)

  const response = NextResponse.next()

  if (!cacheIdCookie) {
    response.cookies.set(CACHE_ID_COOKIE_NAME, crypto.randomUUID(), {
      maxAge: CACHE_ID_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}