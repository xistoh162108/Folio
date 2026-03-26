import "server-only"

import { calculateP95LatencyMs, countRealtimeVisitors } from "@/lib/analytics/metrics"
import type { AnalyticsDashboardSummary, DeviceBreakdownRow, ReferrerBreakdownRow } from "@/lib/contracts/analytics"
import { isMissingColumnError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"

function parseReferrerHost(referrer: string | null) {
  if (!referrer) return "Direct"

  try {
    return new URL(referrer).hostname.replace(/^www\./, "")
  } catch {
    return "Direct"
  }
}

function parseBrowser(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase()

  if (!ua) return "Unknown"
  if (ua.includes("edg/")) return "Edge"
  if (ua.includes("firefox/")) return "Firefox"
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari"
  if (ua.includes("chrome/")) return "Chrome"

  return "Other"
}

function parseDevice(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase()

  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet"
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile"
  if (!ua) return "Unknown"

  return "Desktop"
}

function tally<T extends string>(rows: T[], limit = 5) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    counts.set(row, (counts.get(row) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }))
}

export async function getAnalyticsDashboardSummary(): Promise<AnalyticsDashboardSummary> {
  const analyticsWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const topPostsPromise = prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: 5,
    select: {
      title: true,
      slug: true,
      type: true,
      views: true,
    },
  })

  let events: Array<{
    sessionId: string
    eventType: "PAGEVIEW" | "HEARTBEAT" | "PAGELOAD" | "CONTACT_SUBMIT" | "SUBSCRIBE_REQUEST"
    referrer: string | null
    referrerHost?: string | null
    userAgent: string | null
    browser?: string | null
    deviceType?: string | null
    isBot?: boolean
    duration: number | null
    pageLoadMs?: number | null
    createdAt: Date
  }>

  try {
    events = await prisma.analytics.findMany({
      where: {
        createdAt: {
          gte: analyticsWindowStart,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5_000,
      select: {
        sessionId: true,
        eventType: true,
        referrer: true,
        referrerHost: true,
        userAgent: true,
        browser: true,
        deviceType: true,
        isBot: true,
        duration: true,
        pageLoadMs: true,
        createdAt: true,
      },
    })
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error
    }

    events = await prisma.analytics.findMany({
      where: {
        createdAt: {
          gte: analyticsWindowStart,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5_000,
      select: {
        sessionId: true,
        eventType: true,
        referrer: true,
        userAgent: true,
        duration: true,
        createdAt: true,
      },
    })
  }

  const topPosts = await topPostsPromise

  const humanEvents = events.filter((event) => !event.isBot)
  const humanPageviews = humanEvents.filter((event) => event.eventType === "PAGEVIEW")
  const pageviews = humanPageviews.length
  const durations = events
    .filter((event) => !event.isBot && event.eventType === "HEARTBEAT" && typeof event.duration === "number")
    .map((event) => event.duration as number)
  const pageLoadDurations = events
    .filter((event) => !event.isBot && event.eventType === "PAGELOAD" && typeof event.pageLoadMs === "number")
    .map((event) => event.pageLoadMs as number)
  const realtimeVisitors = countRealtimeVisitors(humanEvents)
  const p95LatencyMs = calculateP95LatencyMs(pageLoadDurations)

  const referrers = tally(humanPageviews.map((event) => event.referrerHost ?? parseReferrerHost(event.referrer)), 5).map(
    ({ label, count }): ReferrerBreakdownRow => ({
      source: label,
      count,
    }),
  )

  const browsers = tally(humanPageviews.map((event) => event.browser ?? parseBrowser(event.userAgent)), 5).map(
    ({ label, count }): DeviceBreakdownRow => ({
      label,
      count,
    }),
  )

  const devices = tally(humanPageviews.map((event) => event.deviceType ?? parseDevice(event.userAgent)), 5).map(
    ({ label, count }): DeviceBreakdownRow => ({
      label,
      count,
    }),
  )

  const avgDwellSeconds =
    durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0

  return {
    pageviews,
    avgDwellSeconds,
    realtimeVisitors,
    p95LatencyMs,
    topContent: topPosts,
    referrers,
    browsers,
    devices,
  }
}
