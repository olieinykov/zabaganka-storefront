export async function notifyStorefrontRevalidate(
  tag: string | string[]
): Promise<void> {
  const url = process.env.STOREFRONT_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) {
    return
  }

  const tags = Array.isArray(tag) ? tag : [tag]

  await Promise.all(
    tags.map((t) =>
      fetch(
        `${url.replace(/\/$/, "")}/api/revalidate?secret=${encodeURIComponent(
          secret
        )}&tag=${encodeURIComponent(t)}`,
        { method: "POST" }
      ).catch(() => {

      })
    )
  )
}
