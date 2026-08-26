import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { Logger, NotificationTypes } from "@medusajs/framework/types"
import { Resend } from "resend"
import { orderPlacedEmail, OrderPlacedEmailProps } from "./templates/order-placed"

export type ResendOptions = {
  api_key: string
  from: string
  html_templates?: Record<string, { subject?: string; content: string }>
}

type InjectedDependencies = {
  logger: Logger
}

export enum Templates {
  ORDER_PLACED = "order-placed",
}

const DEFAULT_SUBJECTS: Record<Templates, string> = {
  [Templates.ORDER_PLACED]: "Дякуємо за замовлення — Zabaganka Boutique",
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "resend"

  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "resend-notification: option `api_key` is required"
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "resend-notification: option `from` is required"
      )
    }
  }

  private getSubject(template: Templates): string {
    return (
      this.options.html_templates?.[template]?.subject || DEFAULT_SUBJECTS[template] || "Zabaganka Boutique"
    )
  }

  private getHtml(template: Templates, data: unknown): string | null {
    if (this.options.html_templates?.[template]?.content) {
      return this.options.html_templates[template].content
    }

    switch (template) {
      case Templates.ORDER_PLACED:
        return orderPlacedEmail(data as OrderPlacedEmailProps)
      default:
        return null
    }
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No notification information provided")
    }

    const template = notification.template as Templates
    const html = this.getHtml(template, notification.data)

    if (!html) {
      this.logger.error(
        `[resend] No email template found for "${notification.template}". Valid options: ${Object.values(
          Templates
        )}`
      )
      return {}
    }

    const { data, error } = await this.resendClient.emails.send({
      from: this.options.from,
      to: [notification.to],
      subject: this.getSubject(template),
      html,
    })

    if (error || !data) {
      this.logger.error(
        `[resend] Failed to send "${notification.template}" email to ${notification.to}: ${
          error?.message || "unknown error"
        }`
      )
      return {}
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
