import type { Logger } from "@medusajs/framework/types"
import {
  MonoCreateInvoiceResponse,
  MonoFiscalChecksResponse,
  MonoInvoiceStatusResponse,
  MonoPaymentProviderOptions,
  MonoReceiptResponse,
} from "./types"


export class MonoApiError extends Error {
  readonly status: number | "timeout" | "network"
  readonly retryable: boolean
  readonly body?: unknown

  constructor(message: string, status: number | "timeout" | "network", body?: unknown) {
    super(message)
    this.name = "MonoApiError"
    this.status = status
    this.body = body
    this.retryable =
      status === "timeout" ||
      status === "network" ||
      status === 429 ||
      (typeof status === "number" && status >= 500)
  }
}

type InjectedDeps = { logger?: Logger }

export class MonoClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly timeoutMs: number
  private readonly logger?: Logger

  private cachedPublicKey: string | null = null

  constructor(options: MonoPaymentProviderOptions, deps: InjectedDeps = {}) {
    this.baseUrl = (options.apiBaseUrl || "https://api.monobank.ua").replace(/\/+$/, "")
    this.token = options.token
    this.timeoutMs = options.requestTimeoutMs ?? 10_000
    this.logger = deps.logger
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "X-Token": this.token,
          "Content-Type": "application/json",
          "X-Cms": "medusajs",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new MonoApiError(`mono API request timed out after ${this.timeoutMs}ms: ${path}`, "timeout")
      }
      throw new MonoApiError(`mono API network error: ${err?.message ?? err}`, "network")
    } finally {
      clearTimeout(timeout)
    }

    const text = await response.text()
    const json = text ? safeJsonParse(text) : undefined

    if (!response.ok) {
      throw new MonoApiError(
        `mono API ${method} ${path} failed with ${response.status}`,
        response.status,
        json
      )
    }

    return json as T
  }

  async createInvoice(input: {
    amountMinor: number
    ccy: number
    reference: string
    destination: string
    redirectUrl: string
    webHookUrl: string
    validitySeconds: number
    paymentType: "debit" | "hold"
    customerEmails?: string[]
  }): Promise<MonoCreateInvoiceResponse> {
    return this.request<MonoCreateInvoiceResponse>("POST", "/api/merchant/invoice/create", {
      amount: input.amountMinor,
      ccy: input.ccy,
      merchantPaymInfo: {
        reference: input.reference,
        destination: input.destination,
        ...(input.customerEmails?.length
          ? { customerEmails: input.customerEmails }
          : {}),
      },
      redirectUrl: input.redirectUrl,
      webHookUrl: input.webHookUrl,
      validity: input.validitySeconds,
      paymentType: input.paymentType,
    })
  }

  /** Safe to retry freely — read-only, this is our reconciliation source of truth. */
  async getInvoiceStatus(invoiceId: string): Promise<MonoInvoiceStatusResponse> {
    return this.request<MonoInvoiceStatusResponse>(
      "GET",
      `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
    )
  }

  async cancelInvoice(input: {
    invoiceId: string
    extRef: string
    amountMinor?: number
  }): Promise<{ status: string; createdDate: string; modifiedDate: string }> {
    return this.request("POST", "/api/merchant/invoice/cancel", {
      invoiceId: input.invoiceId,
      extRef: input.extRef,
      ...(input.amountMinor ? { amount: input.amountMinor } : {}),
    })
  }

  async removeInvoice(invoiceId: string): Promise<void> {
    await this.request("POST", "/api/merchant/invoice/remove", { invoiceId })
  }

  async finalizeHold(input: { invoiceId: string; amountMinor: number }): Promise<{ status: string }> {
    return this.request("POST", "/api/merchant/invoice/finalize", {
      invoiceId: input.invoiceId,
      amount: input.amountMinor,
    })
  }

  async getPublicKey(forceRefresh = false): Promise<string> {
    if (this.cachedPublicKey && !forceRefresh) {
      return this.cachedPublicKey
    }

    const { key } = await this.request<{ key: string }>("GET", "/api/merchant/pubkey")
    this.cachedPublicKey = key
    return key
  }

  async getReceipt(invoiceId: string, email?: string): Promise<MonoReceiptResponse> {
    const query = new URLSearchParams({ invoiceId })
    if (email) query.set("email", email)
    return this.request<MonoReceiptResponse>("GET", `/api/merchant/invoice/receipt?${query}`)
  }

  async getFiscalChecks(invoiceId: string): Promise<MonoFiscalChecksResponse> {
    return this.request<MonoFiscalChecksResponse>(
      "GET",
      `/api/merchant/invoice/fiscal-checks?invoiceId=${encodeURIComponent(invoiceId)}`
    )
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}
