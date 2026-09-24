type MedusaError = {
  // Medusa JS SDK (FetchError): the backend message plus the HTTP status.
  message?: string
  status?: number
  statusText?: string
  // Legacy axios-like shape, kept for any other client that may throw it.
  response?: {
    data: { message?: string } | string
    status: number
  }
}

const GENERIC_MESSAGE =
  "Щось пішло не так. Спробуйте ще раз або оновіть сторінку."

const KNOWN_MESSAGES: { pattern: RegExp; message: string }[] = [
  {
    pattern: /already completed/i,
    message: "Це замовлення вже оформлено. Оновіть сторінку, щоб продовжити.",
  },
  {
    pattern: /inventory|stock|insufficient/i,
    message:
      "На жаль, деяких товарів уже немає в потрібній кількості. Перевірте кошик і спробуйте ще раз.",
  },
  {
    pattern: /shipping/i,
    message: "Не вдалося застосувати спосіб доставки. Оберіть його ще раз.",
  },
  {
    pattern: /payment/i,
    message:
      "Не вдалося обробити оплату. Спробуйте ще раз або оберіть інший спосіб оплати.",
  },
  {
    pattern: /fetch failed|network|failed to fetch|ECONNREFUSED|timeout/i,
    message:
      "Не вдалося з'єднатися з сервером. Перевірте інтернет і спробуйте ще раз.",
  },
]

function messageByStatus(status?: number): string {
  if (!status) return GENERIC_MESSAGE
  if (status === 401 || status === 403) {
    return "Сесія завершилася. Оновіть сторінку та спробуйте ще раз."
  }
  if (status === 404) {
    return "Не вдалося знайти потрібні дані. Оновіть сторінку."
  }
  if (status === 429) {
    return "Забагато запитів. Зачекайте кілька секунд і спробуйте ще раз."
  }
  if (status >= 500) {
    return "Сервіс тимчасово недоступний. Спробуйте трохи пізніше."
  }
  return GENERIC_MESSAGE
}

export function toFriendlyMessage(error: unknown): string {
  const err = (error ?? {}) as MedusaError

  const data = err.response?.data
  const rawMessage =
    (typeof data === "object" && data !== null ? data.message : data) ||
    err.message ||
    ""
  const status = err.response?.status ?? err.status

  if (/[а-яіїєґ]/i.test(rawMessage)) {
    return rawMessage
  }

  const known = KNOWN_MESSAGES.find(({ pattern }) => pattern.test(rawMessage))
  if (known) {
    return known.message
  }

  return messageByStatus(status)
}

export default function medusaError(error: unknown): never {
  const err = (error ?? {}) as MedusaError
  console.error("Medusa request failed:", err.status ?? err.response?.status, err.message ?? err.response?.data)

  throw new Error(toFriendlyMessage(error))
}
