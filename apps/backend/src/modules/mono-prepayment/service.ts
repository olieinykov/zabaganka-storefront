import { ContainerRegistrationKeys, MedusaError, PaymentSessionStatus } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
} from "@medusajs/framework/types"

import MonoPaymentProviderService from "../mono-payment/service"
import { fromMinorUnits } from "../mono-payment/money"
import { CheckoutOptionsRepository } from "../checkout-options/repository"


class MonoPrepaymentProviderService extends MonoPaymentProviderService {
  static identifier = "mono-prepayment"

  protected settings_: CheckoutOptionsRepository

  constructor(container: any, options: any) {
    super(container, options)
    this.settings_ = new CheckoutOptionsRepository(
      container[ContainerRegistrationKeys.PG_CONNECTION]
    )
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const settings = await this.settings_.getPrepaymentSettings()

    if (!settings.amount_minor || settings.amount_minor <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Наложений платіж з передоплатою: сума передоплати ще не налаштована. " +
          "Задайте її в Admin → Налаштування передоплати перед тим, як вмикати цей спосіб оплати на сайті."
      )
    }

    const prepaymentAmount = fromMinorUnits(
      settings.amount_minor,
      settings.currency_code
    )

    return super.initiatePayment({
      ...input,
      amount: prepaymentAmount,
      currency_code: settings.currency_code,
    })
  }

 
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const result = await super.authorizePayment(input)

    if (result.status === PaymentSessionStatus.CAPTURED) {
      return { ...result, status: PaymentSessionStatus.AUTHORIZED }
    }

    return result
  }
}

export default MonoPrepaymentProviderService
