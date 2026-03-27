import "server-only"

import type { CampaignEmailInput, EmailMessageInput, EmailProvider, EmailSendResult } from "@/lib/email/provider"
import { env } from "@/lib/env"
import { appendJsonLine, TEST_EMAIL_OUTBOX_PATH } from "@/lib/testing/sinks"

function isProductionTestHarness() {
  return process.env.__JIMIN_GARDEN_TEST_ENV_LOADED === "1"
}

function shouldFailTestEmail(recipient: string) {
  const forcedRecipients =
    env.EMAIL_TEST_FAIL_RECIPIENTS
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean) ?? []

  return forcedRecipients.includes(recipient.toLowerCase()) || recipient.toLowerCase().endsWith("@fail.test")
}

async function sendSingle(input: EmailMessageInput): Promise<EmailSendResult> {
  if (process.env.NODE_ENV === "production" && !isProductionTestHarness()) {
    return {
      success: false,
      provider: "test",
      to: input.to,
      error: {
        code: "config_error",
        message: "Test email driver is not allowed in production.",
      },
    }
  }

  if (shouldFailTestEmail(input.to)) {
    return {
      success: false,
      provider: "test",
      to: input.to,
      error: {
        code: "provider_error",
        message: `Test email delivery forced failure for ${input.to}.`,
      },
    }
  }

  await appendJsonLine(TEST_EMAIL_OUTBOX_PATH, {
    provider: "test",
    createdAt: new Date().toISOString(),
    messageId: null,
    ...input,
  })

  return {
    success: true,
    provider: "test",
    to: input.to,
    messageId: null,
  }
}

export function createTestEmailProvider(): EmailProvider {
  return {
    sendTransactional(input) {
      return sendSingle(input)
    },
    sendTest(input) {
      return sendSingle(input)
    },
    async sendCampaign(input: CampaignEmailInput) {
      const results: EmailSendResult[] = []

      for (const recipient of input.recipients) {
        results.push(await sendSingle(recipient))
      }

      return results
    },
  }
}
