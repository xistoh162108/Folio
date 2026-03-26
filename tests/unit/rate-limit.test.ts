import { assertRateLimit, clearRateLimitStore, RateLimitExceededError } from "@/lib/security/rate-limit"

describe("rate-limit", () => {
  afterEach(() => {
    clearRateLimitStore()
    vi.useRealTimers()
  })

  it("isolates limits by namespace", () => {
    expect(() =>
      assertRateLimit({
        namespace: "subscription-request",
        identifier: "127.0.0.1",
        limit: 1,
        windowMs: 60_000,
      }),
    ).not.toThrow()

    expect(() =>
      assertRateLimit({
        namespace: "contact-submit",
        identifier: "127.0.0.1",
        limit: 1,
        windowMs: 60_000,
      }),
    ).not.toThrow()
  })

  it("throws once a namespace exceeds its budget", () => {
    assertRateLimit({
      namespace: "newsletter-admin-action",
      identifier: "admin:127.0.0.1",
      limit: 1,
      windowMs: 60_000,
    })

    expect(() =>
      assertRateLimit({
        namespace: "newsletter-admin-action",
        identifier: "admin:127.0.0.1",
        limit: 1,
        windowMs: 60_000,
      }),
    ).toThrow(RateLimitExceededError)
  })

  it("resets after the configured window", () => {
    vi.useFakeTimers()

    assertRateLimit({
      namespace: "analytics-write",
      identifier: "session-1:127.0.0.1",
      limit: 1,
      windowMs: 1_000,
    })

    expect(() =>
      assertRateLimit({
        namespace: "analytics-write",
        identifier: "session-1:127.0.0.1",
        limit: 1,
        windowMs: 1_000,
      }),
    ).toThrow(RateLimitExceededError)

    vi.advanceTimersByTime(1_001)

    expect(() =>
      assertRateLimit({
        namespace: "analytics-write",
        identifier: "session-1:127.0.0.1",
        limit: 1,
        windowMs: 1_000,
      }),
    ).not.toThrow()
  })
})
