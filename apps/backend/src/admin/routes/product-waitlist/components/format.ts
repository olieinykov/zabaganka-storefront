export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function contactLabel(entry: {
  contact_method: "email" | "phone"
  email: string | null
  phone: string | null
}): string {
  return entry.contact_method === "email"
    ? entry.email || "—"
    : entry.phone || "—"
}

export type ClosedReason = "manual" | "product_deleted" | "variant_deleted" | null

export function closedReasonBadge(reason: ClosedReason): {
  label: string
  color: "grey" | "orange"
} {
  switch (reason) {
    case "manual":
      return { label: "Закрито вручну", color: "grey" }
    case "product_deleted":
      return { label: "Товар видалено", color: "orange" }
    case "variant_deleted":
      return { label: "Варіант видалено", color: "orange" }
    default:
      return { label: "—", color: "grey" }
  }
}