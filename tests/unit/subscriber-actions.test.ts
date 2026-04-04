import { beforeEach, describe, expect, it, vi } from "vitest"

const findUniqueMock = vi.fn()
const upsertMock = vi.fn()
const updateMock = vi.fn()
const transactionMock = vi.fn()
const sendTransactionalEmailMock = vi.fn()
const ensureNewsletterTopicsMock = vi.fn()

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    subscriber: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
    $transaction: transactionMock,
  },
}))

vi.mock("@/lib/email/provider", () => ({
  getEmailBaseUrl: () => "http://127.0.0.1:3001",
  isEmailDeliveryConfigured: () => true,
  sendTransactionalEmail: sendTransactionalEmailMock,
}))

vi.mock("@/lib/email/templates/confirm-subscription", () => ({
  buildConfirmSubscriptionEmail: ({ confirmUrl, unsubscribeUrl }: { confirmUrl: string; unsubscribeUrl: string }) => ({
    subject: "Confirm",
    html: `${confirmUrl} ${unsubscribeUrl}`,
    text: `${confirmUrl} ${unsubscribeUrl}`,
  }),
}))

vi.mock("@/lib/email/templates/unsubscribe", () => ({
  buildUnsubscribeEmail: () => ({
    subject: "Unsubscribed",
    html: "<p>bye</p>",
    text: "bye",
  }),
}))

vi.mock("@/lib/email/templates/welcome-subscription", () => ({
  buildWelcomeSubscriptionEmail: ({ homeUrl, unsubscribeUrl }: { homeUrl: string; unsubscribeUrl: string }) => ({
    subject: "Nice to meet you",
    html: `${homeUrl} ${unsubscribeUrl}`,
    text: `${homeUrl} ${unsubscribeUrl}`,
  }),
}))

vi.mock("@/lib/utils/crypto", () => ({
  generateToken: () => "token-123",
  hashToken: (value: string) => `hash:${value}`,
}))

vi.mock("@/lib/security/rate-limit", () => ({
  assertRateLimit: () => undefined,
  getClientIp: () => "127.0.0.1",
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}))

vi.mock("@/lib/newsletter/service", () => ({
  ensureNewsletterTopics: ensureNewsletterTopicsMock,
}))

describe("subscriber actions", () => {
  beforeEach(() => {
    findUniqueMock.mockReset()
    upsertMock.mockReset()
    updateMock.mockReset()
    transactionMock.mockReset()
    sendTransactionalEmailMock.mockReset().mockResolvedValue({
      success: true,
      provider: "test",
      to: "reader@example.com",
      messageId: null,
    })
    ensureNewsletterTopicsMock.mockReset().mockResolvedValue([
      { id: "topic-all", normalizedName: "all" },
      { id: "topic-project", normalizedName: "project-info" },
      { id: "topic-log", normalizedName: "log" },
    ])
  })

  it("returns a subscribed success state for an already confirmed subscriber", async () => {
    findUniqueMock.mockResolvedValue({
      id: "subscriber-1",
      email: "reader@example.com",
      isConfirmed: true,
    })

    const { requestSubscription } = await import("@/lib/actions/subscriber.actions")
    const result = await requestSubscription({
      email: "reader@example.com",
      _honey: "",
      topics: { all: true, projectInfo: false, log: false },
    })

    expect(result).toMatchObject({
      success: true,
      code: "subscribed",
    })
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it("sends a welcome email after a successful confirmation", async () => {
    findUniqueMock.mockResolvedValue({
      id: "subscriber-2",
      email: "reader@example.com",
      isConfirmed: false,
      confirmTokenExpiresAt: new Date(Date.now() + 60_000),
      unsubscribeToken: "unsubscribe-123",
    })
    updateMock.mockResolvedValue(null)

    const { confirmSubscription } = await import("@/lib/actions/subscriber.actions")
    const result = await confirmSubscription("token-123")

    expect(result).toMatchObject({
      success: true,
      code: "confirmed",
    })
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "subscriber-2" },
      }),
    )
    expect(sendTransactionalEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "reader@example.com",
        subject: "Nice to meet you",
      }),
    )
  })

  it("returns an already-unsubscribed success state instead of an error", async () => {
    findUniqueMock.mockResolvedValue({
      id: "subscriber-3",
      email: "reader@example.com",
      unsubscribedAt: new Date(),
    })

    const { unsubscribeSubscription } = await import("@/lib/actions/subscriber.actions")
    const result = await unsubscribeSubscription("unsubscribe-123")

    expect(result).toMatchObject({
      success: true,
      code: "already_unsubscribed",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })
})
