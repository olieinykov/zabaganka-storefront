export type WaitlistAvailableEmailProps = {
  productTitle: string
  productHandle: string
  variantTitle?: string | null
  productThumbnail?: string | null
  storefrontUrl: string
  variantId?: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function waitlistAvailableEmail({
  productTitle,
  productHandle,
  variantTitle,
  productThumbnail,
  storefrontUrl,
  variantId,
}: WaitlistAvailableEmailProps): string {
  const baseUrl = storefrontUrl.replace(/\/$/, "")
  const productUrl = variantId
    ? `${baseUrl}/products/${productHandle}?v_id=${encodeURIComponent(
        variantId
      )}`
    : `${baseUrl}/products/${productHandle}`

  return `<!DOCTYPE html>
<html lang="uk">
  <body style="margin:0;padding:0;background:#f6f3ee;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:20px;letter-spacing:2px;color:#1a1a1a;">ZABAGANKA</div>
        <div style="font-size:10px;letter-spacing:6px;color:#9a8f7d;margin-top:4px;">BOUTIQUE</div>
      </div>

      <div style="background:#ffffff;border-radius:8px;padding:32px;">
        <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px;text-align:center;">
          Товар знову в наявності!
        </h1>
        <p style="font-size:14px;color:#666;text-align:center;margin:0 0 24px;">
          Ви просили повідомити, коли з'явиться:
        </p>

        <table style="width:100%;border-collapse:collapse;">
          <tr>
            ${
              productThumbnail
                ? `<td style="width:80px;padding:8px 0;">
                    <img src="${escapeHtml(
                      productThumbnail
                    )}" width="72" height="72" style="border-radius:6px;object-fit:cover;" />
                  </td>`
                : ""
            }
            <td style="padding:8px 0 8px 12px;">
              <div style="font-size:15px;color:#1a1a1a;font-weight:600;">${escapeHtml(
                productTitle
              )}</div>
              ${
                variantTitle
                  ? `<div style="font-size:13px;color:#666;margin-top:2px;">${escapeHtml(
                      variantTitle
                    )}</div>`
                  : ""
              }
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin-top:28px;">
          <a href="${productUrl}"
            style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;
                   padding:12px 28px;border-radius:4px;font-size:14px;letter-spacing:0.5px;">
            Перейти до товару
          </a>
        </div>

        <p style="font-size:12px;color:#999;text-align:center;margin-top:28px;">
          Кількість товару обмежена — рекомендуємо не зволікати із замовленням.
        </p>
      </div>
    </div>
  </body>
</html>`
}
