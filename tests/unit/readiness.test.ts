import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const queryRawMock = vi.fn()
const webhookDeliveryFindFirstMock = vi.fn()
const newsletterCampaignFindFirstMock = vi.fn()
const newsletterDeliveryFindFirstMock = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: queryRawMock,
    webhookDelivery: {
      findFirst: webhookDeliveryFindFirstMock,
    },
    newsletterCampaign: {
      findFirst: newsletterCampaignFindFirstMock,
    },
    newsletterDelivery: {
      findFirst: newsletterDeliveryFindFirstMock,
    },
  },
}))

let getAdminReadinessDashboard: typeof import("@/lib/ops/readiness").getAdminReadinessDashboard

beforeAll(async () => {
  ;({ getAdminReadinessDashboard } = await import("@/lib/ops/readiness"))
})

beforeEach(() => {
  queryRawMock.mockReset().mockResolvedValue([{ "?column?": 1 }])
  webhookDeliveryFindFirstMock.mockReset().mockResolvedValue(null)
  newsletterCampaignFindFirstMock.mockReset().mockResolvedValue(null)
  newsletterDeliveryFindFirstMock.mockReset().mockResolvedValue(null)
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
})
