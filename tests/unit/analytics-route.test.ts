import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const transactionMock = vi.fn()
const assertRateLimitMock = vi.fn()
const schemaDriftError = new Error("schema drift")

class MockRateLimitExceededError extends Error {
  status = 429 as const
}

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}))

vi.mock("@/lib/security/rate-limit", () => ({
  assertRateLimit: assertRateLimitMock,
  getClientIp: () => "127.0.0.1",
  RateLimitExceededError: MockRateLimitExceededError,
}))

vi.mock("@/lib/db/errors", () => ({
  isMissingColumnError: (error: unknown) => error === schemaDriftError,
}))

let POST: typeof import("@/app/api/analytics/route").POST

beforeAll(async () => {
  ;({ POST } = await import("@/app/api/analytics/route"))
})

beforeEach(() => {
  transactionMock.mockReset()
  assertRateLimitMock.mockReset()
})

describe("POST /api/analytics", () => {
  it("returns 400 for invalid payloads", async () => {
    const response = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-1",
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Invalid analytics payload.",
    })
  })

  it("returns 429 when rate limited", async () => {
    assertRateLimitMock.mockImplementation(() => {
      throw new MockRateLimitExceededError("Too many requests.")
    })

    const response = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-2",
          path: "/notes",
        }),
      }),
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
    })
  })

  it("returns 503 when analytics schema is out of date", async () => {
    transactionMock.mockRejectedValue(schemaDriftError)

    const response = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-3",
          path: "/notes",
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining("Analytics schema is out of date"),
    })
  })

  it("returns 500 for unexpected write failures", async () => {
    transactionMock.mockRejectedValue(new Error("db offline"))

    const response = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-4",
          path: "/notes",
        }),
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: "Analytics write failed.",
    })
  })
})
