import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * Called by the Medusa backend (see `src/api/admin/page-content/[block_key]/route.ts`
 * -> `notifyStorefrontRevalidate`) right after an admin saves a page content
 * block, so the change shows up on the site immediately instead of waiting
 * for the normal ISR window.
 *
 * Protected by a shared secret (`REVALIDATE_SECRET`), set identically here
 * and on the backend. Safe to call repeatedly; if the secret isn't
 * configured the route just no-ops with a 404 so this feature is fully
 * optional.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, message: "REVALIDATE_SECRET is not configured" },
      { status: 404 }
    )
  }

  const { searchParams } = new URL(request.url)
  if (searchParams.get("secret") !== secret) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  const tag = searchParams.get("tag")
  if (!tag) {
    return NextResponse.json({ message: "Missing tag" }, { status: 400 })
  }

  revalidateTag(tag, "max")

  return NextResponse.json({ revalidated: true, tag })
}
