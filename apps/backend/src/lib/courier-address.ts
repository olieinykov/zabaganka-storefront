export function resolveCourierAddress(
  data: Record<string, unknown> | undefined,
  context: Record<string, unknown> | undefined
): string | null {
  const fromData = typeof data?.address === "string" ? data.address.trim() : ""
  if (fromData) {
    return fromData
  }
  const shippingAddress = context?.shipping_address as { address_1?: string } | undefined
  return shippingAddress?.address_1?.trim() || null
}
