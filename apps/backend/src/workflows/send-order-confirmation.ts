import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = {
  id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "item_total",
        "shipping_total",
        "tax_total",
        "metadata",
        "items.*",
        "shipping_address.*",
        "shipping_methods.*",
        "customer.first_name",
        "customer.email",
      ],
      filters: { id },
      options: { throwIfKeyNotFound: true },
    })

    const notification = when({ orders }, (data) => !!data.orders[0].email).then(() => {
      const payload = transform({ orders }, ({ orders }) => [
        {
          to: orders[0].email!,
          channel: "email",
          template: "order-placed",
          idempotency_key: `order-placed-${orders[0].id}`,
          data: {
            order: orders[0],
          },
        },
      ])

      return sendNotificationStep(payload)
    })

    return new WorkflowResponse({ notification })
  }
)