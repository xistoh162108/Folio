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
  it("increments views independently for note and project detail pageviews in the same session", async () => {
    const updateMock = vi.fn()
    const createMock = vi.fn()
    const findFirstPostMock = vi
      .fn()
      .mockResolvedValueOnce({ id: "note-1", status: "PUBLISHED" })
      .mockResolvedValueOnce({ id: "project-1", status: "PUBLISHED" })
    const findFirstAnalyticsMock = vi.fn().mockResolvedValue(null)

    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        post: {
          findFirst: findFirstPostMock,
          update: updateMock,
        },
        analytics: {
          findFirst: findFirstAnalyticsMock,
          create: createMock,
        },
      }),
    )

    const noteResponse = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-detail",
          path: "/notes/seed-note/",
        }),
      }),
    )

    const projectResponse = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-detail",
          path: "/projects/seed-project/",
        }),
      }),
    )

    expect(noteResponse.status).toBe(200)
    expect(projectResponse.status).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(updateMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "note-1" },
      }),
    )
    expect(updateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "project-1" },
      }),
    )
    expect(createMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          path: "/notes/seed-note",
          postId: "note-1",
          eventType: "PAGEVIEW",
        }),
      }),
    )
    expect(createMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          path: "/projects/seed-project",
          postId: "project-1",
          eventType: "PAGEVIEW",
        }),
      }),
    )
  })

  it("does not increment duplicate detail pageviews within the dedupe window", async () => {
    const updateMock = vi.fn()
    const createMock = vi.fn()
    const findFirstPostMock = vi.fn().mockResolvedValue({ id: "note-1", status: "PUBLISHED" })
    const findFirstAnalyticsMock = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-pageview" })

    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        post: {
          findFirst: findFirstPostMock,
          update: updateMock,
        },
        analytics: {
          findFirst: findFirstAnalyticsMock,
          create: createMock,
        },
      }),
    )

    const firstResponse = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-dedupe",
          path: "/notes/repeatable-note",
        }),
      }),
    )

    const secondResponse = await POST(
      new Request("http://127.0.0.1:3001/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          eventType: "PAGEVIEW",
          sessionId: "sess-dedupe",
          path: "/notes/repeatable-note",
        }),
      }),
    )

    expect(firstResponse.status).toBe(200)
    expect(secondResponse.status).toBe(200)
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

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
