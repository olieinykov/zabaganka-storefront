import type { Logger } from "@medusajs/framework/types"
import { MonoClient } from "./client"
import type { MonoPaymentProviderOptions } from "./types"

export function buildMonoClientFromEnv(logger: Logger): MonoClient | null {
  const token = process.env.MONO_TOKEN
  if (!token) {
    return null
  }

  const options: MonoPaymentProviderOptions = {
    token,
    apiBaseUrl: process.env.MONO_API_BASE_URL,
    redirectUrl: process.env.MONO_REDIRECT_URL || "",
    webhookUrl: process.env.MONO_WEBHOOK_URL || "",
  }
  return new MonoClient(options, { logger })
}
