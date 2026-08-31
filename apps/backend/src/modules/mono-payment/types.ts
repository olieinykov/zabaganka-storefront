export type MonoPaymentProviderOptions = {
  /** X-Token from https://web.monobank.ua (or the test token from https://api.monobank.ua/) */
  token: string
  /** Base API URL. Defaults to https://api.monobank.ua */
  apiBaseUrl?: string
  /** Absolute URL the storefront return page lives at, e.g. https://shop.com/checkout/mono/return */
  redirectUrl: string
  /** Absolute URL of the webhook Medusa exposes for this provider, e.g. https://api.shop.com/hooks/payment/mono_mono */
  webhookUrl: string
  /** Invoice validity window in seconds. Defaults to 1800 (30 minutes). */
  validitySeconds?: number
  /** "debit" (funds captured immediately) or "hold" (2-step: authorize then capture). Defaults to "debit". */
  paymentType?: "debit" | "hold"
  /** HTTP request timeout to mono's API, in ms. Defaults to 10000. */
  requestTimeoutMs?: number
}

export type MonoInvoiceStatusValue =
  | "created"
  | "processing"
  | "hold"
  | "success"
  | "failure"
  | "reversed"
  | "expired"

export type MonoCancelListItem = {
  status: string
  amount: number
  ccy: number
  createdDate: string
  modifiedDate: string
  approvalCode?: string
  rrn?: string
  extRef?: string
}

export type MonoInvoiceStatusResponse = {
  invoiceId: string
  status: MonoInvoiceStatusValue
  failureReason?: string
  errCode?: string
  amount: number
  ccy: number
  finalAmount?: number
  createdDate: string
  modifiedDate: string
  reference?: string
  destination?: string
  cancelList?: MonoCancelListItem[]
  paymentInfo?: {
    maskedPan?: string
    approvalCode?: string
    rrn?: string
    tranId?: string
    bank?: string
    paymentSystem?: string
    paymentMethod?: string
  }
}

export type MonoCreateInvoiceResponse = {
  invoiceId: string
  pageUrl: string
}

export type MonoWebhookPayload = MonoInvoiceStatusResponse

export type MonoReceiptResponse = {
  file: string
}

export type MonoFiscalCheck = {
  id: string
  type: string
  status: string
  statusDescription?: string
  taxUrl?: string
  file?: string
  fiscalizationSource?: string
}

export type MonoFiscalChecksResponse = {
  checks: MonoFiscalCheck[]
}

export type MonoSessionData = {
  mono_invoice_id: string | null
  mono_reference: string
  mono_ledger_id: string
  page_url: string | null
  status: MonoInvoiceStatusValue | "removed"
  amount_minor: number
  currency_code: string
  payment_type: "debit" | "hold"
  cart_id: string
  attempt_number: number
}
