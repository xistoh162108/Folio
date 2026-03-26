import "server-only"

import { Resend } from "resend"

import type { CampaignEmailInput, EmailMessageInput, EmailProvider, EmailSendResult } from "@/lib/email/provider"
import { env } from "@/lib/env"

function createConfigError(to: string, message: string): EmailSendResult {
  return {
    success: false,
    provider: "resend",
    to,
    error: {
      code: "config_error",
      message,
    },
  }
}

async function sendSingle(client: Resend, input: EmailMessageInput): Promise<EmailSendResult> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return createConfigError(input.to, "Resend email delivery is not configured.")
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    })

    if (error) {
      return {
        success: false,
        provider: "resend",
        to: input.to,
        error: {
          code: "provider_error",
          message: "Resend email delivery failed.",
          providerMessage: error.message,
        },
      }
    }

    return {
      success: true,
      provider: "resend",
      to: input.to,
      messageId: data?.id ?? null,
    }
  } catch (error) {
    return {
      success: false,
      provider: "resend",
      to: input.to,
      error: {
        code: "provider_error",
        message: "Resend email delivery failed.",
        providerMessage: error instanceof Error ? error.message : "Unknown provider error.",
      },
    }
  }
}

export function createResendEmailProvider(client = new Resend(env.RESEND_API_KEY)) : EmailProvider {
  return {
    sendTransactional(input) {
      return sendSingle(client, input)
    },
    sendTest(input) {
      return sendSingle(client, input)
    },
    async sendCampaign(input: CampaignEmailInput) {
      const results: EmailSendResult[] = []

      for (const recipient of input.recipients) {
        results.push(await sendSingle(client, recipient))
      }

      return results
    },
  }
}
