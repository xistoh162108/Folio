import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const queryRawMock = vi.fn()
const auditLogFindManyMock = vi.fn()
const webhookDeliveryFindFirstMock = vi.fn()
const webhookDeliveryFindManyMock = vi.fn()
const newsletterCampaignFindFirstMock = vi.fn()
const newsletterCampaignFindManyMock = vi.fn()
const newsletterDeliveryFindFirstMock = vi.fn()
const newsletterDeliveryFindManyMock = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
    auditLog: {
      findMany: auditLogFindManyMock,
    },
    webhookDelivery: {
      findFirst: webhookDeliveryFindFirstMock,
      findMany: webhookDeliveryFindManyMock,
    },
    newsletterCampaign: {
      findFirst: newsletterCampaignFindFirstMock,
      findMany: newsletterCampaignFindManyMock,
    },
    newsletterDelivery: {
      findFirst: newsletterDeliveryFindFirstMock,
      findMany: newsletterDeliveryFindManyMock,
    },
  },
}))

let getAdminReadinessDashboard: typeof import("@/lib/ops/readiness").getAdminReadinessDashboard

beforeAll(async () => {
  ;({ getAdminReadinessDashboard } = await import("@/lib/ops/readiness"))
})

beforeEach(() => {
  queryRawMock.mockReset().mockResolvedValue([{ "?column?": 1 }])
  auditLogFindManyMock.mockReset().mockResolvedValue([])
  webhookDeliveryFindFirstMock.mockReset().mockResolvedValue(null)
  webhookDeliveryFindManyMock.mockReset().mockResolvedValue([])
  newsletterCampaignFindFirstMock.mockReset().mockResolvedValue(null)
  newsletterCampaignFindManyMock.mockReset().mockResolvedValue([])
  newsletterDeliveryFindFirstMock.mockReset().mockResolvedValue(null)
  newsletterDeliveryFindManyMock.mockReset().mockResolvedValue([])
})

describe("getAdminReadinessDashboard", () => {
  it("builds readiness cards from the server-side source of truth", async () => {
    const dashboard = await getAdminReadinessDashboard()

    expect(dashboard.cards.find((card) => card.key === "database")).toMatchObject({
      status: "ready",
      value: "Connected",
    })

    expect(dashboard.cards.find((card) => card.key === "storage")).toMatchObject({
      status: "ready",
      detail: expect.stringContaining("Test storage driver"),
    })

    expect(dashboard.cards.find((card) => card.key === "post-media")).toMatchObject({
      status: "ready",
      value: "public",
      detail: expect.stringContaining("post-media is public"),
    })

    expect(dashboard.cards.find((card) => card.key === "post-files")).toMatchObject({
      status: "ready",
      value: "private",
      detail: expect.stringContaining("post-files is private"),
    })

    expect(dashboard.cards.find((card) => card.key === "email")).toMatchObject({
      status: "ready",
      detail: expect.stringContaining("Test email driver"),
    })

    expect(dashboard.lastWorkerActivity).toBeNull()
    expect(dashboard.serviceLog).toEqual([])
  })

  it("fails closed when test storage is configured in production", async () => {
    vi.stubEnv("NODE_ENV", "production")

    try {
      const dashboard = await getAdminReadinessDashboard()

      expect(dashboard.cards.find((card) => card.key === "storage")).toMatchObject({
        status: "not_ready",
        value: "Test driver",
        detail: expect.stringContaining("not allowed in production"),
      })

      expect(dashboard.cards.find((card) => card.key === "post-media")).toMatchObject({
        status: "not_ready",
        value: "missing",
      })
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it("projects a lightweight service log from audit, webhook, and newsletter records", async () => {
    auditLogFindManyMock.mockResolvedValue([
      {
        id: "audit-1",
        actionType: "POST_DELETE",
        targetType: "Post",
        targetId: "post-1",
        actorUserId: "user-1",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    ])
    webhookDeliveryFindManyMock.mockResolvedValue([
      {
        id: "webhook-1",
        eventType: "contact.submit",
        destination: "test://ops",
        status: "SUCCESS",
        lastError: null,
        deliveredAt: new Date("2026-04-04T10:05:00.000Z"),
        createdAt: new Date("2026-04-04T10:04:00.000Z"),
      },
    ])
    newsletterCampaignFindManyMock.mockResolvedValue([
      {
        id: "campaign-1",
        subject: "Dispatch",
        status: "COMPLETED",
        totalRecipients: 5,
        sentCount: 5,
        failedCount: 0,
        lastError: null,
        startedAt: new Date("2026-04-04T10:06:00.000Z"),
        completedAt: new Date("2026-04-04T10:07:00.000Z"),
        updatedAt: new Date("2026-04-04T10:07:00.000Z"),
      },
    ])
    newsletterDeliveryFindManyMock.mockResolvedValue([
      {
        id: "delivery-1",
        email: "reader@example.com",
        status: "SENT",
        errorMessage: null,
        sentAt: new Date("2026-04-04T10:08:00.000Z"),
        updatedAt: new Date("2026-04-04T10:08:00.000Z"),
        createdAt: new Date("2026-04-04T10:08:00.000Z"),
      },
    ])

    const dashboard = await getAdminReadinessDashboard()

    expect(dashboard.serviceLog).toHaveLength(4)
    expect(dashboard.serviceLog[0]).toMatchObject({
      id: "delivery:delivery-1",
      status: "success",
      source: "reader@example.com",
    })
    expect(dashboard.serviceLog.some((entry) => entry.id === "webhook:webhook-1")).toBe(true)
    expect(dashboard.serviceLog.some((entry) => entry.id === "campaign:campaign-1")).toBe(true)
    expect(dashboard.serviceLog.some((entry) => entry.id === "audit:audit-1")).toBe(true)
  })
})
