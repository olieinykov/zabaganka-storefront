type Money = number | string | { numeric?: number; value?: string | number; amount?: number; toString?(): string } | null | undefined

type OrderItem = {
  product_title?: string | null
  title?: string | null
  variant_title?: string | null
  quantity: number
  total: Money
  thumbnail?: string | null
}

type ShippingMethod = {
  name?: string | null
  total: Money
}

type Address = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  city?: string | null
  phone?: string | null
}

export type OrderPlacedEmailProps = {
  order: {
    id: string
    display_id?: number | string | null
    email?: string | null
    currency_code: string
    total: Money
    item_total?: Money
    shipping_total?: Money
    tax_total?: Money
    items?: OrderItem[]
    shipping_methods?: ShippingMethod[]
    shipping_address?: Address | null
    customer?: { first_name?: string | null; email?: string | null } | null
    metadata?: Record<string, unknown> | null
  }
}

function getNumber(value: Money): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return parseFloat(value) || 0
  if (value && typeof value === "object") {
    if ('numeric' in value && value.numeric !== undefined) return Number(value.numeric)
    if ('value' in value && value.value !== undefined) return Number(value.value)
    if ('amount' in value && value.amount !== undefined) return Number(value.amount)
    if (typeof value.toString === "function") {
      const str = value.toString()
      return str === "[object Object]" ? 0 : (parseFloat(str) || 0)
    }
  }
  return 0
}

function formatMoney(value: Money, currency: string): string {
  let num = 0

  if (typeof value === "number") {
    num = value
  } else if (typeof value === "string") {
    num = parseFloat(value)
  } else if (value && typeof value === "object") {
    if ('numeric' in value && value.numeric !== undefined) {
      num = Number(value.numeric)
    } else if ('value' in value && value.value !== undefined) {
      num = Number(value.value)
    } else if ('amount' in value && value.amount !== undefined) {
      num = Number(value.amount)
    } else if (typeof value.toString === "function") {
      const str = value.toString()
      num = str === "[object Object]" ? 0 : parseFloat(str)
    }
  }

  if (isNaN(num)) {
    num = 0
  }

  try {
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: currency?.toUpperCase() || "UAH",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(num)
  } catch {
    return `${num.toFixed(2)} ${currency?.toUpperCase() || ""}`
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function orderPlacedEmail({ order }: OrderPlacedEmailProps): string {
  const currency = order.currency_code
  const displayId = order.display_id ?? order.id
  const firstName = order.customer?.first_name || order.shipping_address?.first_name || ""
  const delivery = (order.metadata?.delivery as Record<string, unknown> | undefined) || undefined

  let calculatedItemTotal = 0

  const itemsHtml = order.items?.map((item) => {
   const title = escapeHtml(item.product_title || item.title || "Товар")
    const variant = item.variant_title ? escapeHtml(item.variant_title) : null
    const rawQty = (item as any).quantity
    const qty = rawQty !== undefined && rawQty !== null ? getNumber(rawQty as Money) : 1
    
    const dbTotal = getNumber(item.total)
    const unitPrice = getNumber((item as any).unit_price)
    
    const actualItemTotal = dbTotal > 0 ? dbTotal : (unitPrice * qty)
    calculatedItemTotal += actualItemTotal

    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;">
          <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${title}</div>
          ${variant ? `<div style="font-size:13px;color:#777;margin-top:2px;">${variant}</div>` : ""}
          <div style="font-size:13px;color:#777;margin-top:2px;">Кількість: ${qty}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;font-size:15px;color:#1a1a1a;white-space:nowrap;">
          ${formatMoney(actualItemTotal, currency)}
        </td>
      </tr>`
  }).join("") || ""

  const shippingMethod = order.shipping_methods?.[0]
  const shippingMethodName = shippingMethod?.name ? escapeHtml(shippingMethod.name) : null
  
  const dbShippingTotal = getNumber(order.shipping_total)
  const methodAmount = shippingMethod ? (getNumber((shippingMethod as any).amount) || getNumber(shippingMethod.total)) : 0
  const actualShippingTotal = dbShippingTotal > 0 ? dbShippingTotal : methodAmount

  const finalOrderTotal = calculatedItemTotal + actualShippingTotal

  const deliveryLine = delivery
    ? [
        delivery.city_name ? `м. ${escapeHtml(String(delivery.city_name))}` : null,
        delivery.warehouse_name ? escapeHtml(String(delivery.warehouse_name)) : null,
        delivery.comment ? escapeHtml(String(delivery.comment)) : null,
      ]
        .filter(Boolean)
        .join(", ")
    : null
  return `
<!DOCTYPE html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Дякуємо за замовлення</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f7f5f2;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;padding-bottom:24px;">
        <span style="font-size:22px;letter-spacing:4px;color:#1a2b4c;">ZABAGANKA</span>
        <div style="font-size:10px;letter-spacing:6px;color:#9a8f7d;margin-top:4px;">BOUTIQUE</div>
      </div>

      <div style="background:#ffffff;border-radius:8px;padding:32px;">
        <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;text-align:center;">
          Дякуємо за замовлення${firstName ? `, ${escapeHtml(firstName)}` : ""}!
        </h1>
        <p style="font-size:14px;color:#666;text-align:center;margin:0 0 24px;">
          Ми отримали ваше замовлення №${escapeHtml(String(displayId))} і вже почали його готувати.
        </p>

        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
        </table>

        <table style="width:100%;margin-top:16px;font-size:14px;color:#444;">
          ${
            calculatedItemTotal !== undefined
              ? `<tr><td style="padding:4px 0;">Товари</td><td style="padding:4px 0;text-align:right;">${formatMoney(
                  calculatedItemTotal,
                  currency
                )}</td></tr>`
              : ""
          }
          ${
            actualShippingTotal !== undefined
              ? `<tr><td style="padding:4px 0;">Доставка${
                  shippingMethodName ? ` (${shippingMethodName})` : ""
                }</td><td style="padding:4px 0;text-align:right;">${formatMoney(
                  actualShippingTotal,
                  currency
                )}</td></tr>`
              : ""
          }
          <tr style="border-top:1px solid #eee;">
            <td style="padding:10px 0 0;font-weight:700;color:#1a1a1a;">Разом</td>
            <td style="padding:10px 0 0;text-align:right;font-weight:700;color:#1a1a1a;">
              ${formatMoney(finalOrderTotal, currency)}
            </td>
          </tr>
        </table>

        ${
          deliveryLine || order.shipping_address
            ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:13px;color:#666;">
                <div style="font-weight:600;color:#1a1a1a;margin-bottom:4px;">Доставка</div>
                ${deliveryLine ? `<div>${deliveryLine}</div>` : ""}
                ${
                  order.shipping_address?.address_1
                    ? `<div>${escapeHtml(order.shipping_address.address_1)}</div>`
                    : ""
                }
              </div>`
            : ""
        }
      </div>
    </div>
  </body>
</html>`
}