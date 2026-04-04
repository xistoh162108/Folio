import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TEST_EMAIL_OUTBOX_PATH, clearTestArtifacts, readJsonLines } from "@/lib/testing/sinks"
import { buildConfirmSubscriptionEmail } from "@/lib/email/templates/confirm-subscription"
import { buildUnsubscribeEmail } from "@/lib/email/templates/unsubscribe"
import { buildWelcomeSubscriptionEmail } from "@/lib/email/templates/welcome-subscription"

const emailsSendMock = vi.fn()

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return {
      emails: {
        send: emailsSendMock,
      },
    }
  }),
}))

const ORIGINAL_ENV = { ...process.env }

describe("email provider", () => {
  beforeEach(async () => {
    await clearTestArtifacts()
    vi.resetModules()
    emailsSendMock.mockReset()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(async () => {
    await clearTestArtifacts()
    process.env = { ...ORIGINAL_ENV }
  })

  it("writes transactional mail to the test outbox when the test driver is active", async () => {
    Object.assign(process.env, { NODE_ENV: "test", EMAIL_DRIVER: "test", APP_URL: "http://127.0.0.1:3001" })

    const { sendTransactionalEmail } = await import("@/lib/email/provider")
    const result = await sendTransactionalEmail({
      to: "reader@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    expect(result).toMatchObject({
      success: true,
      provider: "test",
      to: "reader@example.com",
    })

    const outbox = await readJsonLines<{
      to: string
      subject: string
      html: string
    }>(TEST_EMAIL_OUTBOX_PATH)

    expect(outbox).toHaveLength(1)
    expect(outbox[0]).toMatchObject({
      to: "reader@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
    })
  })

  it("persists attachment metadata in the test outbox", async () => {
    Object.assign(process.env, { NODE_ENV: "test", EMAIL_DRIVER: "test", APP_URL: "http://127.0.0.1:3001" })

    const { sendTransactionalEmail } = await import("@/lib/email/provider")
    await sendTransactionalEmail({
      to: "reader@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
      attachments: [
        {
          filename: "brief.pdf",
          content: Buffer.from("attachment-binary"),
          contentType: "application/pdf",
        },
      ],
    })

    const outbox = await readJsonLines<{
      attachments: Array<{ filename: string; contentType: string | null; size: number }>
    }>(TEST_EMAIL_OUTBOX_PATH)

    expect(outbox[0]?.attachments).toEqual([
      {
        filename: "brief.pdf",
        contentType: "application/pdf",
        size: Buffer.from("attachment-binary").byteLength,
      },
    ])
  })

  it("returns a config error in production when Resend is not configured", async () => {
    Object.assign(process.env, { NODE_ENV: "production", EMAIL_DRIVER: "resend" })
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    delete process.env.APP_URL

    const { sendTransactionalEmail } = await import("@/lib/email/provider")
    const result = await sendTransactionalEmail({
      to: "reader@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    expect(result).toMatchObject({
      success: false,
      provider: "resend",
      to: "reader@example.com",
      error: {
        code: "config_error",
      },
    })
  })

  it("uses the Resend SDK for live transactional sends", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      EMAIL_DRIVER: "resend",
      RESEND_API_KEY: "re_test_123",
      EMAIL_FROM: "hello@xistoh.com",
      APP_URL: "https://jimin.garden",
    })
    emailsSendMock.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    })

    const { sendTransactionalEmail } = await import("@/lib/email/provider")
    const result = await sendTransactionalEmail({
      to: "reader@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    expect(result).toMatchObject({
      success: true,
      provider: "resend",
      to: "reader@example.com",
      messageId: "email_123",
    })

    expect(emailsSendMock).toHaveBeenCalledWith({
      from: "hello@xistoh.com",
      to: ["reader@example.com"],
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    })
  })

  it("fans out campaign sends while preserving recipient order", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      EMAIL_DRIVER: "resend",
      RESEND_API_KEY: "re_test_123",
      EMAIL_FROM: "hello@xistoh.com",
      APP_URL: "https://jimin.garden",
    })
    emailsSendMock
      .mockResolvedValueOnce({ data: { id: "email_a" }, error: null })
      .mockResolvedValueOnce({ data: { id: "email_b" }, error: null })

    const { sendCampaignEmails } = await import("@/lib/email/provider")
    const results = await sendCampaignEmails({
      recipients: [
        {
          to: "older@example.com",
          subject: "Campaign",
          html: "<p>Older</p>",
          text: "Older",
        },
        {
          to: "newer@example.com",
          subject: "Campaign",
          html: "<p>Newer</p>",
          text: "Newer",
        },
      ],
    })

    expect(results.map((result) => result.to)).toEqual(["older@example.com", "newer@example.com"])
    expect(emailsSendMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: ["older@example.com"],
      }),
    )
    expect(emailsSendMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: ["newer@example.com"],
      }),
    )
  })
})

describe("email templates", () => {
  it("builds a confirmation email with explicit confirm and unsubscribe links", () => {
    const template = buildConfirmSubscriptionEmail({
      confirmUrl: "https://jimin.garden/subscribe/confirm?token=abc",
      unsubscribeUrl: "https://jimin.garden/unsubscribe?token=def",
    })

    expect(template.subject).toContain("Confirm")
    expect(template.html).toContain("/subscribe/confirm?token=abc")
    expect(template.text).toContain("/unsubscribe?token=def")
  })

  it("builds an unsubscribe confirmation email", () => {
    const template = buildUnsubscribeEmail({
      homeUrl: "https://jimin.garden",
      resubscribeUrl: "https://jimin.garden",
    })

    expect(template.subject).toContain("unsubscribed")
    expect(template.html).toContain("https://jimin.garden")
    expect(template.text).toContain("Subscription cancelled")
  })

  it("builds a welcome email inside the shared exact-v0 frame", () => {
    const template = buildWelcomeSubscriptionEmail({
      homeUrl: "https://jimin.garden",
      unsubscribeUrl: "https://jimin.garden/unsubscribe?token=def",
    })

    expect(template.subject).toContain("Nice to meet you")
    expect(template.html).toContain("Jimin Park")
    expect(template.html).toContain("Need a quieter inbox?")
    expect(template.text).toContain("Unsubscribe: https://jimin.garden/unsubscribe?token=def")
  })
})
