export type AnalyticsEventType = "PAGEVIEW" | "HEARTBEAT" | "PAGELOAD"

export interface AnalyticsEventInput {
  eventType: AnalyticsEventType
  sessionId: string
  path: string
  postId?: string
  referrer?: string
  duration?: number
  pageLoadMs?: number
  userAgentHint?: string
}

export interface TopContentRow {
  title: string
  slug: string
  type: "NOTE" | "PROJECT"
  views: number
}

export interface ReferrerBreakdownRow {
  source: string
  count: number
}

export interface DeviceBreakdownRow {
  label: string
  count: number
}

export interface AnalyticsDashboardSummary {
  pageviews: number
  avgDwellSeconds: number
  realtimeVisitors: number
  p95LatencyMs: number
  topContent: TopContentRow[]
  referrers: ReferrerBreakdownRow[]
  browsers: DeviceBreakdownRow[]
  devices: DeviceBreakdownRow[]
}
