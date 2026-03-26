import "server-only"

import { env } from "@/lib/env"
import { getCanonicalAppUrl } from "@/lib/runtime/origin"

export type EmailProviderName = "resend" | "test"
export type EmailProviderErrorCode = "config_error" | "provider_error"

export interface EmailMessageInput {
  to: string
  subject: string
  html: string
  text?: string
}

export interface CampaignEmailInput {
  recipients: EmailMessageInput[]
}

export interface EmailProviderError {
  code: EmailProviderErrorCode
  message: string
  providerMessage?: string
}

export type EmailSendResult =
  | {
      success: true
      provider: EmailProviderName
      to: string
      messageId: string | null
    }
  | {
      success: false
      provider: EmailProviderName
      to: string
      error: EmailProviderError
    }

export interface EmailProvider {
  sendTransactional(input: EmailMessageInput): Promise<EmailSendResult>
  sendTest(input: EmailMessageInput): Promise<EmailSendResult>
  sendCampaign(input: CampaignEmailInput): Promise<EmailSendResult[]>
}

type EmailDriver = EmailProviderName

function resolveEmailDriver(): EmailDriver {
  return env.EMAIL_DRIVER === "test" ? "test" : "resend"
}

export function getEmailBaseUrl() {
  return getCanonicalAppUrl()
}

export function getEmailConfigError() {
  const driver = resolveEmailDriver()

  if (driver === "test") {
    return process.env.NODE_ENV === "production" ? "Test email driver is not allowed in production." : null
  }

  const missing: string[] = []
  if (!env.RESEND_API_KEY) {
    missing.push("RESEND_API_KEY")
  }
  if (!env.EMAIL_FROM) {
    missing.push("EMAIL_FROM")
  }
  if (!env.APP_URL) {
    missing.push("APP_URL")
  }

  return missing.length > 0 ? `Email delivery is not configured: ${missing.join(", ")}.` : null
}

export function isEmailDeliveryConfigured() {
  return getEmailConfigError() === null
}

async function createProvider(): Promise<EmailProvider> {
  const driver = resolveEmailDriver()

  if (driver === "test") {
    const { createTestEmailProvider } = await import("@/lib/email/providers/test")
    return createTestEmailProvider()
  }

  const { createResendEmailProvider } = await import("@/lib/email/providers/resend")
  return createResendEmailProvider()
}

function logEmailResult(kind: "transactional" | "test" | "campaign", result: EmailSendResult) {
  if (result.success) {
    console.info(`[email:${kind}:sent]`, {
      provider: result.provider,
      to: result.to,
      messageId: result.messageId,
    })
    return
  }

  console.error(`[email:${kind}:failed]`, {
    provider: result.provider,
    to: result.to,
    code: result.error.code,
    message: result.error.message,
    providerMessage: result.error.providerMessage,
  })
}

export async function sendTransactionalEmail(input: EmailMessageInput) {
  const provider = await createProvider()
  const result = await provider.sendTransactional(input)
  logEmailResult("transactional", result)
  return result
}

export async function sendTestEmail(input: EmailMessageInput) {
  const provider = await createProvider()
  const result = await provider.sendTest(input)
  logEmailResult("test", result)
  return result
}

export async function sendCampaignEmails(input: CampaignEmailInput) {
  const provider = await createProvider()
  const results = await provider.sendCampaign(input)
  for (const result of results) {
    logEmailResult("campaign", result)
  }
  return results
}
