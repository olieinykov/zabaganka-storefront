import crypto from "node:crypto"

type KnexLike = any

export type MonoInvoiceRow = {
  id: string
  cart_id: string | null
  payment_session_id: string
  payment_collection_id: string | null
  order_id: string | null
  invoice_id: string | null
  reference: string
  attempt_number: number
  amount_minor: number
  currency_code: string
  payment_type: "debit" | "hold"
  status:
    | "created"
    | "processing"
    | "hold"
    | "success"
    | "failure"
    | "reversed"
    | "expired"
    | "removed"
  last_processed_status: string | null
  last_modified_date: string | null
  failure_reason: string | null
  err_code: string | null
  page_url: string | null
  redirect_url: string | null
  webhook_url: string | null
  expires_at: Date | null
  raw_last_payload: Record<string, unknown> | null
  refunded_amount_minor: number
  fiscal_check_url: string | null
  fiscal_check_status: string | null
  fiscal_check_checked_at: Date | null
  created_at: Date
  updated_at: Date
}

const TERMINAL_STATUSES = ["success", "failure", "reversed", "expired", "removed"]
const STATUS_RANK: Record<string, number> = {
  created: 0,
  processing: 1,
  hold: 2,
  success: 3,
  failure: 3,
  reversed: 4,
  expired: 4,
  removed: 4,
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`
}

export class MonoLedgerRepository {
  constructor(private readonly pg: KnexLike) {}

  async createAttempt(input: {
    paymentSessionId: string
    amountMinor: number
    currencyCode: string
    paymentType: "debit" | "hold"
    redirectUrl?: string | null
    webhookUrl?: string | null
  }): Promise<MonoInvoiceRow> {
    const row = {
      id: id("moninv"),
      payment_session_id: input.paymentSessionId,
      reference: input.paymentSessionId,
      attempt_number: 1,
      amount_minor: input.amountMinor,
      currency_code: input.currencyCode,
      payment_type: input.paymentType,
      status: "created" as const,
      redirect_url: input.redirectUrl ?? null,
      webhook_url: input.webhookUrl ?? null,
    }
    const [inserted] = await this.pg("mono_invoice").insert(row).returning("*")
    return inserted
  }

  async findByPaymentSessionId(sessionId: string): Promise<MonoInvoiceRow | null> {
    const row = await this.pg("mono_invoice")
      .where({ payment_session_id: sessionId })
      .first()
    return row ?? null
  }

  async findByInvoiceId(invoiceId: string): Promise<MonoInvoiceRow | null> {
    const row = await this.pg("mono_invoice").where({ invoice_id: invoiceId }).first()
    return row ?? null
  }

  async findByOrderId(orderId: string): Promise<MonoInvoiceRow | null> {
    const row = await this.pg("mono_invoice")
      .where({ order_id: orderId })
      .orderBy("created_at", "desc")
      .first()
    return row ?? null
  }

  async attachInvoiceId(id: string, invoiceId: string, pageUrl: string) {
    const [row] = await this.pg("mono_invoice")
      .where({ id })
      .update({ invoice_id: invoiceId, page_url: pageUrl, updated_at: new Date() })
      .returning("*")
    return row
  }

  async setExpiry(id: string, expiresAt: Date) {
    const [row] = await this.pg("mono_invoice")
      .where({ id })
      .update({ expires_at: expiresAt, updated_at: new Date() })
      .returning("*")
    return row
  }

  async attachOrder(invoiceId: string, orderId: string) {
    await this.pg("mono_invoice")
      .where({ invoice_id: invoiceId })
      .update({ order_id: orderId, updated_at: new Date() })
  }

  async recordRefund(id: string, refundedAmountMinor: number) {
    const [row] = await this.pg("mono_invoice")
      .where({ id })
      .update({ refunded_amount_minor: refundedAmountMinor, updated_at: new Date() })
      .returning("*")
    return row
  }

  async recordFiscalCheck(
    invoiceId: string,
    input: { url: string | null; status: string | null }
  ) {
    const [row] = await this.pg("mono_invoice")
      .where({ invoice_id: invoiceId })
      .update({
        fiscal_check_url: input.url,
        fiscal_check_status: input.status,
        fiscal_check_checked_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*")
    return row
  }

  async listPendingFiscalCheckLookups(input: {
    recheckAfterMinutes: number
    stopCheckingAfterHours: number
  }): Promise<MonoInvoiceRow[]> {
    const recheckCutoff = new Date(Date.now() - input.recheckAfterMinutes * 60_000)
    const giveUpCutoff = new Date(Date.now() - input.stopCheckingAfterHours * 3_600_000)

    return this.pg("mono_invoice")
      .where({ status: "success" })
      .whereNull("fiscal_check_url")
      .andWhere("created_at", ">", giveUpCutoff)
      .andWhere((builder: any) =>
        builder
          .whereNull("fiscal_check_checked_at")
          .orWhere("fiscal_check_checked_at", "<", recheckCutoff)
      )
  }

  async applyStatus(input: {
    invoiceId: string
    status: string
    modifiedDate?: string | null
    failureReason?: string | null
    errCode?: string | null
    rawPayload?: Record<string, unknown> | null
  }): Promise<{
    applied: boolean
    reason: "applied" | "duplicate" | "stale" | "not_found"
    invoice: MonoInvoiceRow | null
  }> {
    return this.pg.transaction(async (trx) => {
      const invoice: MonoInvoiceRow | undefined = await trx("mono_invoice")
        .where({ invoice_id: input.invoiceId })
        .forUpdate()
        .first()

      if (!invoice) {
        return { applied: false, reason: "not_found" as const, invoice: null }
      }

      const incomingModified = input.modifiedDate ? Date.parse(input.modifiedDate) : 0
      const currentModified = invoice.last_modified_date
        ? Date.parse(invoice.last_modified_date)
        : 0

      const isDuplicate =
        invoice.last_processed_status === input.status && incomingModified <= currentModified
      if (isDuplicate) {
        return { applied: false, reason: "duplicate" as const, invoice }
      }

      const isRefundTransition =
        invoice.last_processed_status === "success" && input.status === "reversed"

      const isStaleByTime =
        !isRefundTransition &&
        incomingModified > 0 &&
        currentModified > 0 &&
        incomingModified < currentModified

      const isStaleByRank =
        !isRefundTransition &&
        !!invoice.last_processed_status &&
        TERMINAL_STATUSES.includes(invoice.last_processed_status) &&
        invoice.last_processed_status !== input.status &&
        (STATUS_RANK[input.status] ?? 0) <= (STATUS_RANK[invoice.last_processed_status] ?? 0)

      if (isStaleByTime || isStaleByRank) {
        return { applied: false, reason: "stale" as const, invoice }
      }

      const [updated] = await trx("mono_invoice")
        .where({ id: invoice.id })
        .update({
          status: input.status,
          last_processed_status: input.status,
          last_modified_date: input.modifiedDate ?? invoice.last_modified_date,
          failure_reason: input.failureReason ?? invoice.failure_reason,
          err_code: input.errCode ?? invoice.err_code,
          raw_last_payload: input.rawPayload
            ? JSON.stringify(input.rawPayload)
            : invoice.raw_last_payload,
          updated_at: new Date(),
        })
        .returning("*")

      return { applied: true, reason: "applied" as const, invoice: updated }
    })
  }

  async logWebhook(input: {
    invoiceId?: string | null
    status?: string | null
    signatureValid: boolean
    outcome:
      | "processed"
      | "skipped_duplicate"
      | "skipped_stale"
      | "rejected_invalid_signature"
      | "rejected_unknown_invoice"
      | "error"
    errorMessage?: string | null
    payload: Record<string, unknown>
  }) {
    await this.pg("mono_webhook_log").insert({
      id: id("monwh"),
      invoice_id: input.invoiceId ?? null,
      status: input.status ?? null,
      signature_valid: input.signatureValid,
      outcome: input.outcome,
      error_message: input.errorMessage ?? null,
      payload: JSON.stringify(input.payload),
    })
  }

  async listExpirableAttempts(now: Date): Promise<MonoInvoiceRow[]> {
    return this.pg("mono_invoice")
      .whereIn("status", ["created", "processing"])
      .andWhere("expires_at", "<", now)
  }
}
