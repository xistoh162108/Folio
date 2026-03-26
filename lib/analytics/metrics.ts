export function calculateP95(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.ceil(sorted.length * 0.95) - 1

  return Math.round(sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0)
}

export const calculateP95LatencyMs = calculateP95

export function countRealtimeVisitors(
  events: Array<{
    sessionId: string
    eventType: string
    createdAt: Date
    isBot?: boolean | null
  }>,
  now = new Date(),
): number {
  const windowStart = now.getTime() - 5 * 60 * 1000
  const sessions = new Set<string>()

  for (const event of events) {
    if (event.isBot) continue
    if (event.eventType !== "PAGEVIEW" && event.eventType !== "HEARTBEAT") continue
    if (event.createdAt.getTime() < windowStart) continue
    sessions.add(event.sessionId)
  }

  return sessions.size
}
