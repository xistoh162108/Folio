import { calculateP95LatencyMs, countRealtimeVisitors } from "@/lib/analytics/metrics"

describe("analytics metrics", () => {
  it("calculates P95 latency from page-load durations", () => {
    expect(calculateP95LatencyMs([90, 120, 180, 240, 800])).toBe(800)
    expect(calculateP95LatencyMs([])).toBe(0)
  })

  it("counts distinct realtime visitors over the last five minutes", () => {
    const now = new Date("2026-03-26T12:00:00.000Z")

    expect(
      countRealtimeVisitors(
        [
          {
            sessionId: "a",
            eventType: "PAGEVIEW",
            createdAt: new Date("2026-03-26T11:58:00.000Z"),
            isBot: false,
          },
          {
            sessionId: "a",
            eventType: "HEARTBEAT",
            createdAt: new Date("2026-03-26T11:59:00.000Z"),
            isBot: false,
          },
          {
            sessionId: "b",
            eventType: "HEARTBEAT",
            createdAt: new Date("2026-03-26T11:56:30.000Z"),
            isBot: false,
          },
          {
            sessionId: "c",
            eventType: "PAGEVIEW",
            createdAt: new Date("2026-03-26T11:40:00.000Z"),
            isBot: false,
          },
          {
            sessionId: "bot",
            eventType: "PAGEVIEW",
            createdAt: new Date("2026-03-26T11:59:00.000Z"),
            isBot: true,
          },
        ],
        now,
      ),
    ).toBe(2)
  })
})
