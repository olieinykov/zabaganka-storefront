import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"


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
  console.log("TAG: " + tag)
  revalidateTag(tag, { expire: 0 })

  return NextResponse.json({ revalidated: true, tag })
}
