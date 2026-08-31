import {
  AbstractPaymentProvider,
  ContainerRegistrationKeys,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type { Logger } from "@medusajs/framework/types"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

import { MonoClient } from "./client"
import { verifyMonoSignature } from "./signature"
import { toMinorUnits, fromMinorUnits, currencyToCcy } from "./money"
import { MonoLedgerRepository } from "./repository"
import type {
  MonoInvoiceStatusValue,
  MonoPaymentProviderOptions,
  MonoSessionData,
  MonoWebhookPayload,
} from "./types"

type InjectedDependencies = {
  logger: Logger
  [ContainerRegistrationKeys.PG_CONNECTION]: any
}

function toSessionStatus(status: MonoInvoiceStatusValue | "removed"): PaymentSessionStatus {
  switch (status) {
    case "created":
    case "processing":
      return PaymentSessionStatus.PENDING
    case "hold":
      return PaymentSessionStatus.AUTHORIZED
    case "success":
      return PaymentSessionStatus.CAPTURED
    case "failure":
    case "expired":
    case "removed":
      return PaymentSessionStatus.ERROR
    case "reversed":
      return PaymentSessionStatus.CAPTURED
    default:
      return PaymentSessionStatus.PENDING
  }
}

class MonoPaymentProviderService extends AbstractPaymentProvider<MonoPaymentProviderOptions> {
  static identifier = "mono"

  protected logger_: Logger
  protected ledger_: MonoLedgerRepository
  protected client_: MonoClient
  protected options_: MonoPaymentProviderOptions

  constructor(container: InjectedDependencies, options: MonoPaymentProviderOptions) {
    super(container, options)

    this.logger_ = container.logger
    this.ledger_ = new MonoLedgerRepository(
      container[ContainerRegistrationKeys.PG_CONNECTION]
    )
    this.options_ = options
    this.client_ = new MonoClient(options, { logger: container.logger })

    if (!options?.token) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Plata by mono: `token` option is required (X-Token from web.monobank.ua)."
      )
    }
    if (!options?.redirectUrl || !options?.webhookUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Plata by mono: `redirectUrl` and `webhookUrl` options are required."
      )
    }
  }

  private toSessionData(invoice: any): MonoSessionData {
    return {
      mono_invoice_id: invoice.invoice_id,
      mono_reference: invoice.reference,
      mono_ledger_id: invoice.id,
      page_url: invoice.page_url,
      status: invoice.status,
      amount_minor: invoice.amount_minor,
      currency_code: invoice.currency_code,
      payment_type: invoice.payment_type,
      cart_id: invoice.cart_id,
      attempt_number: invoice.attempt_number,
    } as MonoSessionData
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = (input.data?.session_id as string) ?? input.context?.idempotency_key

    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Plata by mono: missing session_id when initiating payment."
      )
    }

    const existing = await this.ledger_.findByPaymentSessionId(sessionId)
    if (existing?.invoice_id) {
      return {
        id: sessionId,
        status: toSessionStatus(existing.status as MonoInvoiceStatusValue),
        data: this.toSessionData(existing) as unknown as Record<string, unknown>,
      }
    }

    const currencyCode = input.currency_code
    const amountMinor = toMinorUnits(input.amount, currencyCode)
    const paymentType = this.options_.paymentType || "debit"
    const validitySeconds = this.options_.validitySeconds ?? 1800

    const ledgerRow =
      existing ??
      (await this.ledger_.createAttempt({
        paymentSessionId: sessionId,
        amountMinor,
        currencyCode,
        paymentType,
        redirectUrl: this.options_.redirectUrl,
        webhookUrl: this.options_.webhookUrl,
      }))

    try {
      const invoice = await this.client_.createInvoice({
        amountMinor,
        ccy: currencyToCcy(currencyCode),
        reference: sessionId,
        destination: `Order payment ${sessionId}`,
        redirectUrl: `${this.options_.redirectUrl}?session_id=${encodeURIComponent(sessionId)}`,
        webHookUrl: this.options_.webhookUrl,
        validitySeconds,
        paymentType,
        customerEmails: input.context?.customer?.email
          ? [input.context.customer.email]
          : undefined,
      })

      const expiresAt = new Date(Date.now() + validitySeconds * 1000)
      await this.ledger_.attachInvoiceId(ledgerRow.id, invoice.invoiceId, invoice.pageUrl)
      const updated = await this.ledger_.setExpiry(ledgerRow.id, expiresAt)

      return {
        id: sessionId,
        status: PaymentSessionStatus.PENDING,
        data: this.toSessionData(updated) as unknown as Record<string, unknown>,
      }
    } catch (err) {
      this.logger_.error(
        `Plata by mono: failed to create invoice for session ${sessionId}: ${err}`
      )
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        `Plata by mono: could not create invoice (${err instanceof Error ? err.message : err})`
      )
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const sessionId = (input.data?.session_id as string) ?? input.context?.idempotency_key
    const existing = sessionId ? await this.ledger_.findByPaymentSessionId(sessionId) : null

    if (!existing) {
      return this.initiatePayment(input) as unknown as UpdatePaymentOutput
    }

    if (existing.status === "success" || existing.status === "hold") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Plata by mono: cannot change the amount of a payment that is already authorized or paid. Cancel and create a new order instead."
      )
    }

    if (existing.invoice_id && ["created", "processing"].includes(existing.status)) {
      await this.safeRemoveInvoice(existing)
    }

    return this.initiatePayment(input) as unknown as UpdatePaymentOutput
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    const invoice = data?.mono_invoice_id
      ? await this.ledger_.findByInvoiceId(data.mono_invoice_id)
      : null

    if (!invoice) {
      return { status: PaymentSessionStatus.PENDING, data: input.data }
    }

    return {
      status: toSessionStatus(invoice.status as MonoInvoiceStatusValue),
      data: this.toSessionData(invoice) as unknown as Record<string, unknown>,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    const invoice = data?.mono_invoice_id
      ? await this.ledger_.findByInvoiceId(data.mono_invoice_id)
      : null

    if (!invoice || !invoice.invoice_id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Plata by mono: cannot capture, no invoice on file for this payment."
      )
    }

    if (invoice.payment_type === "hold" && invoice.status === "hold") {
      try {
        await this.client_.finalizeHold({
          invoiceId: invoice.invoice_id,
          amountMinor: invoice.amount_minor,
        })
      } catch (err) {
        throw new MedusaError(
          MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
          `Plata by mono: failed to finalize hold ${invoice.invoice_id}: ${err instanceof Error ? err.message : err}`
        )
      }
    }

    return { data: this.toSessionData(invoice) as unknown as Record<string, unknown> }
  }

  private async safeRemoveInvoice(invoice: any) {
    if (!invoice.invoice_id) return
    try {
      await this.client_.removeInvoice(invoice.invoice_id)
    } catch (err) {
      this.logger_.warn(
        `Plata by mono: could not remove invoice ${invoice.invoice_id} (likely already settled or expired): ${err}`
      )
    }
    await this.ledger_.applyStatus({
      invoiceId: invoice.invoice_id,
      status: "expired",
      modifiedDate: new Date().toISOString(),
    })
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    const invoice = data?.mono_invoice_id
      ? await this.ledger_.findByInvoiceId(data.mono_invoice_id)
      : null

    if (!invoice) {
      return { data: input.data }
    }

    if (invoice.status === "success") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Plata by mono: this payment was already captured. Use a refund instead of cancel."
      )
    }

    if (invoice.status === "hold") {
      await this.client_.cancelInvoice({
        invoiceId: invoice.invoice_id!,
        extRef: `void-${invoice.id}-${Date.now()}`,
      })
    } else if (["created", "processing"].includes(invoice.status)) {
      await this.safeRemoveInvoice(invoice)
    }

    const updated = await this.ledger_.applyStatus({
      invoiceId: invoice.invoice_id!,
      status: "expired",
      modifiedDate: new Date().toISOString(),
    })

    return { data: this.toSessionData(updated.invoice ?? invoice) as unknown as Record<string, unknown> }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    const invoice = data?.mono_invoice_id
      ? await this.ledger_.findByInvoiceId(data.mono_invoice_id)
      : null

    if (invoice && ["created", "processing"].includes(invoice.status)) {
      await this.safeRemoveInvoice(invoice)
    } else if (invoice) {
      this.logger_.info(
        `Plata by mono: session deleted while invoice ${invoice.invoice_id} was in status "${invoice.status}"; left untouched.`
      )
    }

    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    const invoice = data?.mono_invoice_id
      ? await this.ledger_.findByInvoiceId(data.mono_invoice_id)
      : null

    if (!invoice || !invoice.invoice_id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Plata by mono: cannot refund, no invoice on file for this payment."
      )
    }
    if (invoice.status !== "success") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Plata by mono: cannot refund invoice ${invoice.invoice_id} in status "${invoice.status}".`
      )
    }

    const refundAmountMinor = toMinorUnits(input.amount, invoice.currency_code)
    const alreadyRefunded = invoice.refunded_amount_minor ?? 0
    if (alreadyRefunded + refundAmountMinor > invoice.amount_minor) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Plata by mono: refund amount exceeds the remaining refundable amount."
      )
    }

    try {
      await this.client_.cancelInvoice({
        invoiceId: invoice.invoice_id,
        extRef: `refund-${invoice.id}-${Date.now()}`,
        amountMinor: refundAmountMinor,
      })
    } catch (err) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        `Plata by mono: refund request failed (${err instanceof Error ? err.message : err}). No money was moved.`
      )
    }

    const updated = await this.ledger_.recordRefund(
      invoice.id,
      alreadyRefunded + refundAmountMinor
    )

    return { data: this.toSessionData(updated) as unknown as Record<string, unknown> }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = input.data as unknown as MonoSessionData
    if (!data?.mono_invoice_id) {
      return { data: input.data }
    }

    let invoice = await this.ledger_.findByInvoiceId(data.mono_invoice_id)
    if (!invoice) {
      return { data: input.data }
    }

    try {
      const live = await this.client_.getInvoiceStatus(data.mono_invoice_id)
      const result = await this.ledger_.applyStatus({
        invoiceId: data.mono_invoice_id,
        status: live.status,
        modifiedDate: live.modifiedDate,
        failureReason: live.failureReason,
        errCode: live.errCode,
        rawPayload: live as unknown as Record<string, unknown>,
      })
      invoice = result.invoice ?? invoice
    } catch (err) {
      this.logger_.warn(
        `Plata by mono: status check for ${data.mono_invoice_id} failed, using cached state: ${err}`
      )
    }

    return { data: this.toSessionData(invoice) as unknown as Record<string, unknown> }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data as unknown as MonoSessionData
    if (!data?.status) {
      return { status: PaymentSessionStatus.PENDING }
    }
    return { status: toSessionStatus(data.status) }
  }

  async getWebhookActionAndData(
    webhookData: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const rawBody = (webhookData.rawData as Buffer) ?? Buffer.from(JSON.stringify(webhookData.data))
    const headers = (webhookData.headers ?? {}) as Record<string, string>
    const signature = headers["x-sign"] ?? headers["X-Sign"]

    const payload = webhookData.data as unknown as MonoWebhookPayload

    let signatureValid = await this.verifySignature(rawBody, signature)
    if (!signatureValid) {
       signatureValid = await this.verifySignature(rawBody, signature, true)
    }

    if (!signatureValid) {
      await this.ledger_.logWebhook({
        invoiceId: payload?.invoiceId,
        status: payload?.status,
        signatureValid: false,
        outcome: "rejected_invalid_signature",
        payload: webhookData.data as Record<string, unknown>,
      })
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Plata by mono: webhook signature verification failed."
      )
    }

    if (!payload?.invoiceId) {
      await this.ledger_.logWebhook({
        signatureValid: true,
        outcome: "error",
        errorMessage: "Webhook payload missing invoiceId",
        payload: webhookData.data as Record<string, unknown>,
      })
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const invoice = await this.ledger_.findByInvoiceId(payload.invoiceId)
    if (!invoice) {
      await this.ledger_.logWebhook({
        invoiceId: payload.invoiceId,
        status: payload.status,
        signatureValid: true,
        outcome: "rejected_unknown_invoice",
        payload: webhookData.data as Record<string, unknown>,
      })
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    let status = payload.status
    let modifiedDate = payload.modifiedDate
    let failureReason = payload.failureReason
    let errCode = payload.errCode
    let rawReconciledPayload: Record<string, unknown> = webhookData.data as Record<
      string,
      unknown
    >

    try {
      const live = await this.client_.getInvoiceStatus(payload.invoiceId)
      status = live.status
      modifiedDate = live.modifiedDate
      failureReason = live.failureReason
      errCode = live.errCode
      rawReconciledPayload = live as unknown as Record<string, unknown>
    } catch (err) {
      this.logger_.warn(
        `Plata by mono: reconciliation GET failed for ${payload.invoiceId}, trusting webhook body: ${err}`
      )
    }

    const result = await this.ledger_.applyStatus({
      invoiceId: payload.invoiceId,
      status,
      modifiedDate,
      failureReason,
      errCode,
      rawPayload: rawReconciledPayload,
    })

    if (!result.applied) {
      await this.ledger_.logWebhook({
        invoiceId: payload.invoiceId,
        status: payload.status,
        signatureValid: true,
        outcome: result.reason === "duplicate" ? "skipped_duplicate" : "skipped_stale",
        payload: webhookData.data as Record<string, unknown>,
      })
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    await this.ledger_.logWebhook({
      invoiceId: payload.invoiceId,
      status: payload.status,
      signatureValid: true,
      outcome: "processed",
      payload: webhookData.data as Record<string, unknown>,
    })

    const amount = fromMinorUnits(invoice.amount_minor, invoice.currency_code)
    const commonData = { session_id: invoice.payment_session_id!, amount }

    switch (status) {
      case "hold":
        return { action: PaymentActions.AUTHORIZED, data: commonData }
      case "success":
        return { action: PaymentActions.SUCCESSFUL, data: commonData }
      case "failure":
        return { action: PaymentActions.FAILED, data: commonData }
      case "created":
      case "processing":
        return { action: PaymentActions.PENDING, data: commonData }
      case "reversed":
        return { action: PaymentActions.NOT_SUPPORTED, data: commonData }
      default:
        return { action: PaymentActions.NOT_SUPPORTED, data: commonData }
    }
  }

  private async verifySignature(
    rawBody: Buffer,
    signatureBase64: string | undefined,
    forceRefreshKey = false
  ): Promise<boolean> {
    if (!signatureBase64) return false
    try {
      const publicKeyBase64 = await this.client_.getPublicKey(forceRefreshKey)
      return verifyMonoSignature({ rawBody, signatureBase64, publicKeyBase64 })
    } catch (err) {
      this.logger_.error(`Plata by mono: could not fetch public key to verify webhook: ${err}`)
      return false
    }
  }
}

export default MonoPaymentProviderService
