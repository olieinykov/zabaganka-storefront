export type DeliveryDestinationData = {
  type?: "warehouse" | "postomat" | "courier"
  city_name?: string
  warehouse_name?: string
  address?: string
  comment?: string
}

const COURIER_COMMENT_DISPLAY_LIMIT = 60

export function truncateComment(
  comment: string,
  limit = COURIER_COMMENT_DISPLAY_LIMIT
) {
  if (comment.length <= limit) {
    return comment
  }
  return `${comment.slice(0, limit).trimEnd()}…`
}

export function formatDeliveryDestination(
  data: DeliveryDestinationData | undefined
) {
  if (!data?.type) {
    return null
  }

  if (data.type === "courier") {
    const cityPart = data.city_name ? `м. ${data.city_name}` : null
    const place = [cityPart, data.address].filter(Boolean).join(", ")
    const commentPart = data.comment
      ? `Коментар: ${truncateComment(data.comment)}`
      : null
    return [place, commentPart].filter(Boolean).join(". ") || null
  }

  // "warehouse" | "postomat"
  if (data.city_name && data.warehouse_name) {
    return `${data.city_name}, ${data.warehouse_name}`
  }

  return data.city_name || null
}