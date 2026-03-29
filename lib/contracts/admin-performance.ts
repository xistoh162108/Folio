export type AdminPerformanceMetricStatus = "measured" | "skipped"

export interface AdminPerformanceMetric {
  key: string
  label: string
  status: AdminPerformanceMetricStatus
  durationMs: number | null
  detail: string
}

export interface AdminPerformanceDashboard {
  measuredAt: string
  timings: AdminPerformanceMetric[]
  navPrefetchStrategy: string
  notes: string[]
}

export interface AdminClientPerformanceEntry {
  route: string
  durationMs: number
  measuredAt: string
}

export interface AdminClientPerformanceSnapshot {
  recentNavigation: AdminClientPerformanceEntry | null
  recentRuntimeHandoff: AdminClientPerformanceEntry | null
  navPrefetchStrategy: string
}
