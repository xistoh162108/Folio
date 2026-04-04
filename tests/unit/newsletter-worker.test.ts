import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const claimedDeliveries = [
  {
    id: "delivery-older",
    campaignId: "campaign-1",
    email: "older@example.com",
    subject: "Subject",
    html: "<p>Hello</p>",
    text: "Hello",
    unsubscribeToken: "older-token",
  },
  {
    id: "delivery-newer",
    campaignId: "campaign-1",
    email: "newer@example.com",
    subject: "Subject",
    html: "<p>Hello</p>",
    text: "Hello",
    unsubscribeToken: "newer-token",
  },
]

const queryRawMock = vi.fn()
const newsletterDeliveryUpdateMock = vi.fn()
const newsletterDeliveryCountMock = vi.fn()
const newsletterAssetFindManyMock = vi.fn()
const sendCampaignEmailsMock = vi.fn()
const refreshCampaignAggregatesMock = vi.fn()
const kickWorkerRouteMock = vi.fn()
const downloadAssetFromSupabaseMock = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
    newsletterAsset: {
      findMany: newsletterAssetFindManyMock,
    },
    newsletterDelivery: {
      update: newsletterDeliveryUpdateMock,
      count: newsletterDeliveryCountMock,
    },
  },
}))

vi.mock("@/lib/email/provider", () => ({
  sendCampaignEmails: sendCampaignEmailsMock,
  getEmailBaseUrl: () => "http://127.0.0.1:3001",
}))

vi.mock("@/lib/newsletter/service", () => ({
  refreshCampaignAggregates: refreshCampaignAggregatesMock,
}))

vi.mock("@/lib/storage/supabase", () => ({
  downloadAssetFromSupabase: downloadAssetFromSupabaseMock,
}))

vi.mock("@/lib/workers/dispatch", () => ({
  kickWorkerRoute: kickWorkerRouteMock,
}))

vi.mock("@/lib/db/errors", () => ({
  isMissingColumnError: () => false,
  isMissingTableError: () => false,
  isMissingRelationInRawQuery: () => false,
}))

let POST: typeof import("@/app/api/worker/newsletter/route").POST

beforeAll(async () => {
  ;({ POST } = await import("@/app/api/worker/newsletter/route"))
})

beforeEach(() => {
  queryRawMock.mockReset().mockResolvedValue(claimedDeliveries)
  newsletterAssetFindManyMock.mockReset().mockResolvedValue([])
  newsletterDeliveryUpdateMock.mockReset().mockResolvedValue(null)
  newsletterDeliveryCountMock.mockReset().mockResolvedValue(0)
  downloadAssetFromSupabaseMock.mockReset().mockResolvedValue(null)
  sendCampaignEmailsMock.mockReset().mockResolvedValue(
    claimedDeliveries.map((delivery) => ({
      success: true,
      provider: "test",
      to: delivery.email,
      messageId: null,
    })),
  )
  refreshCampaignAggregatesMock.mockReset().mockResolvedValue(undefined)
  kickWorkerRouteMock.mockReset().mockResolvedValue(false)
})

describe("newsletter worker ordering", () => {
  it("processes claimed deliveries in the order returned by the claim query", async () => {
    const observedEmails: string[] = []
    sendCampaignEmailsMock.mockImplementation(async ({ recipients }: { recipients: Array<{ to: string }> }) => {
      observedEmails.push(...recipients.map((recipient) => recipient.to))
      return recipients.map((recipient) => ({
        success: true,
        provider: "test",
        to: recipient.to,
        messageId: null,
      }))
    })

    const response = await POST(
      new Request("http://127.0.0.1:3001/api/worker/newsletter", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      processed: claimedDeliveries.length,
      sent: claimedDeliveries.length,
      failed: 0,
    })
    expect(observedEmails).toEqual(["older@example.com", "newer@example.com"])
    expect(newsletterDeliveryUpdateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "delivery-older" },
        data: expect.objectContaining({ status: "SENT" }),
      }),
    )
    expect(newsletterDeliveryUpdateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "delivery-newer" },
        data: expect.objectContaining({ status: "SENT" }),
      }),
    )
  })

  it("attaches newsletter file assets to outgoing campaign emails", async () => {
    newsletterAssetFindManyMock.mockResolvedValue([
      {
        campaignId: "campaign-1",
        bucket: "post-files",
        storagePath: "newsletters/files/campaign-1/brief.pdf",
        originalName: "brief.pdf",
        mime: "application/pdf",
      },
    ])
    downloadAssetFromSupabaseMock.mockResolvedValue({
      buffer: Buffer.from("pdf-binary"),
      contentType: "application/pdf",
    })

    await POST(
      new Request("http://127.0.0.1:3001/api/worker/newsletter", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }),
    )

    expect(sendCampaignEmailsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recipients: expect.arrayContaining([
          expect.objectContaining({
            to: "older@example.com",
            attachments: [
              expect.objectContaining({
                filename: "brief.pdf",
                contentType: "application/pdf",
              }),
            ],
          }),
        ]),
      }),
    )
  })
})
