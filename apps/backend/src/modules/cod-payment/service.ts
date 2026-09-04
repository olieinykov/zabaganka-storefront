import {
  AbstractPaymentProvider,
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
import { randomUUID } from "node:crypto"

type InjectedDependencies = {
  logger: Logger
}

type CodSessionData = {
  session_id: string
  amount: unknown
  currency_code: string
  captured: boolean
}


class CodPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "cod"

  protected logger_: Logger

  constructor(container: InjectedDependencies, options: Record<string, unknown>) {
    super(container, options)
    this.logger_ = container.logger
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId =
      (input.data?.session_id as string | undefined) ??
      input.context?.idempotency_key ??
      randomUUID()

    const data: CodSessionData = {
      session_id: sessionId,
      amount: input.amount,
      currency_code: input.currency_code,
      captured: false,
    }

    return {
      id: sessionId,
      status: PaymentSessionStatus.PENDING,
      data: data as unknown as Record<string, unknown>,
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const existing = input.data as unknown as CodSessionData | undefined

    const data: CodSessionData = {
      session_id: existing?.session_id ?? (input.context?.idempotency_key || randomUUID()),
      amount: input.amount,
      currency_code: input.currency_code,
      captured: existing?.captured ?? false,
    }

    return {
      status: PaymentSessionStatus.PENDING,
      data: data as unknown as Record<string, unknown>,
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return { status: PaymentSessionStatus.AUTHORIZED, data: input.data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const existing = input.data as unknown as CodSessionData | undefined
    return {
      data: { ...(existing ?? {}), captured: true } as unknown as Record<string, unknown>,
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const captured = Boolean(
      (input.data as unknown as CodSessionData | undefined)?.captured
    )
    return {
      status: captured ? PaymentSessionStatus.CAPTURED : PaymentSessionStatus.AUTHORIZED,
    }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    this.logger_.warn(
      "Наложений платіж (без передоплати): отримано неочікуваний webhook — цей провайдер їх не використовує."
    )
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default CodPaymentProviderService
