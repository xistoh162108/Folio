import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const requireUserMock = vi.fn()
const sendTransactionalEmailMock = vi.fn()
const newsletterCampaignFindUniqueMock = vi.fn()
const newsletterCampaignDeleteMock = vi.fn()
const newsletterAssetFindManyMock = vi.fn()
const subscriberFindUniqueMock = vi.fn()
const subscriberUpdateMock = vi.fn()
const deleteAssetFromSupabaseMock = vi.fn()

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}))

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock,
}))

vi.mock("@/lib/security/rate-limit", () => ({
  assertRateLimit: () => undefined,
  getClientIp: () => "127.0.0.1",
  RateLimitExceededError: class RateLimitExceededError extends Error {},
}))

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    newsletterCampaign: {
      findUnique: newsletterCampaignFindUniqueMock,
      delete: newsletterCampaignDeleteMock,
    },
    newsletterAsset: {
      findMany: newsletterAssetFindManyMock,
    },
    subscriber: {
      findUnique: subscriberFindUniqueMock,
      update: subscriberUpdateMock,
    },
  },
}))

vi.mock("@/lib/db/errors", () => ({
  isMissingColumnError: () => false,
  isMissingRecordError: () => false,
  isMissingTableError: () => false,
}))

vi.mock("@/lib/email/provider", () => ({
  getEmailBaseUrl: () => "http://127.0.0.1:3001",
  isEmailDeliveryConfigured: () => true,
  sendTestEmail: vi.fn(),
  sendTransactionalEmail: sendTransactionalEmailMock,
}))

vi.mock("@/lib/email/templates/newsletter", () => ({
  buildNewsletterEmail: vi.fn(),
}))

vi.mock("@/lib/email/templates/unsubscribe", () => ({
  buildUnsubscribeEmail: () => ({
    subject: "Unsubscribed",
    html: "<p>bye</p>",
    text: "bye",
  }),
}))

vi.mock("@/lib/newsletter/compose", () => ({
  buildNewsletterComposePayload: vi.fn(),
}))

vi.mock("@/lib/newsletter/service", () => ({
  ensureNewsletterTopics: vi.fn(),
  getEligibleSubscribers: vi.fn(),
  normalizeTopicFilters: (topics: string[]) => topics,
  refreshCampaignAggregates: vi.fn(),
}))

vi.mock("@/lib/storage/supabase", () => ({
  deleteAssetFromSupabase: deleteAssetFromSupabaseMock,
  downloadAssetFromSupabase: vi.fn(),
}))

vi.mock("@/lib/workers/dispatch", () => ({
  kickWorkerRoute: vi.fn(),
}))

let deleteCampaign: typeof import("@/lib/actions/newsletter.actions").deleteCampaign
let unsubscribeSubscriberAsAdmin: typeof import("@/lib/actions/newsletter.actions").unsubscribeSubscriberAsAdmin

beforeAll(async () => {
  ;({ deleteCampaign, unsubscribeSubscriberAsAdmin } = await import("@/lib/actions/newsletter.actions"))
})

describe("newsletter admin actions", () => {
  beforeEach(() => {
    requireUserMock.mockReset().mockResolvedValue({ id: "user-1" })
    sendTransactionalEmailMock.mockReset().mockResolvedValue({
      success: true,
      provider: "test",
      to: "reader@example.com",
      messageId: null,
    })
    newsletterCampaignFindUniqueMock.mockReset().mockResolvedValue({
      id: "campaign-1",
      status: "DRAFT",
    })
    newsletterCampaignDeleteMock.mockReset().mockResolvedValue(null)
    newsletterAssetFindManyMock.mockReset().mockResolvedValue([])
    subscriberFindUniqueMock.mockReset().mockResolvedValue({
      id: "subscriber-1",
      email: "reader@example.com",
      unsubscribeToken: "unsubscribe-123",
      unsubscribedAt: null,
    })
    subscriberUpdateMock.mockReset().mockResolvedValue(null)
    deleteAssetFromSupabaseMock.mockReset().mockResolvedValue(undefined)
  })

  it("keeps the unsubscribe action successful but reports notification email failure", async () => {
    sendTransactionalEmailMock.mockResolvedValue({
      success: false,
      provider: "test",
      to: "reader@example.com",
      error: {
        code: "provider_error",
        message: "forced failure",
      },
    })

    const result = await unsubscribeSubscriberAsAdmin({
      subscriberId: "subscriber-1",
    })

    expect(result).toMatchObject({
      success: true,
      message: "Subscriber unsubscribed. Notification email could not be sent.",
    })
    expect(subscriberUpdateMock).toHaveBeenCalled()
  })

  it("deletes the campaign before best-effort asset cleanup and reports partial cleanup", async () => {
    newsletterAssetFindManyMock.mockResolvedValue([
      { bucket: "post-files", storagePath: "newsletters/files/campaign-1/a.pdf" },
      { bucket: "post-media", storagePath: "newsletters/media/campaign-1/image.png" },
    ])
    deleteAssetFromSupabaseMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("storage failure"))

    const result = await deleteCampaign({
      campaignId: "campaign-1",
    })

    expect(result).toMatchObject({
      success: true,
      message: "Campaign removed. Some stored assets could not be cleaned up.",
    })
    expect(newsletterCampaignDeleteMock).toHaveBeenCalledWith({
      where: { id: "campaign-1" },
    })
    expect(newsletterCampaignDeleteMock.mock.invocationCallOrder[0]).toBeLessThan(
      deleteAssetFromSupabaseMock.mock.invocationCallOrder[0],
    )
  })
})
