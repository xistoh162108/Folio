"use client"

import { useEffect, useState } from "react"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { renderProgressBar } from "@/components/v0/fixtures"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { AdminClientPerformanceSnapshot, AdminPerformanceDashboard } from "@/lib/contracts/admin-performance"
import type { AnalyticsDashboardSummary, DeviceBreakdownRow, ReferrerBreakdownRow } from "@/lib/contracts/analytics"
import { readAdminClientPerformanceSnapshot } from "@/lib/ops/admin-performance-client"
import type { ReadinessDashboard } from "@/lib/ops/readiness"

interface AnalyticsScreenProps {
  summary: AnalyticsDashboardSummary
  readiness: ReadinessDashboard
  performance: AdminPerformanceDashboard
  isDarkMode?: boolean
  brandLabel?: string
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) {
    return "--"
  }

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
}

function toPercentageRows<T extends ReferrerBreakdownRow | DeviceBreakdownRow>(
  rows: T[],
  getLabel: (row: T) => string,
) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return rows.map((row) => ({
    label: getLabel(row),
    percentage: total > 0 ? Math.max(1, Math.round((row.count / total) * 100)) : 0,
  }))
}

function formatLatency(ms: number | null | undefined) {
  if (!ms || ms <= 0) {
    return "--"
  }

  return `${ms}ms`
}

export function AnalyticsScreen({
  summary,
  readiness,
  performance,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: AnalyticsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const [clientPerformance, setClientPerformance] = useState<AdminClientPerformanceSnapshot | null>(null)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const accentText = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const referrerRows = toPercentageRows(summary.referrers, (row) => row.source)
  const browserRows = toPercentageRows(summary.browsers, (row) => row.label)
  const deviceRows = toPercentageRows(summary.devices, (row) => row.label)

  useEffect(() => {
    const syncClientPerformance = () => {
      setClientPerformance(readAdminClientPerformanceSnapshot())
    }

    syncClientPerformance()
    window.addEventListener("focus", syncClientPerformance)
    document.addEventListener("visibilitychange", syncClientPerformance)

    return () => {
      window.removeEventListener("focus", syncClientPerformance)
      document.removeEventListener("visibilitychange", syncClientPerformance)
    }
  }, [])

  return (
    <AdminShell currentSection="overview" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="min-h-full p-4 sm:p-6 md:h-full md:min-h-0 md:overflow-y-auto">
        <div className="space-y-6 pb-10 font-mono">
            <div>
              <p className={`text-xs ${mutedText}`}>// analytics</p>
              <h2 className="text-lg mt-1">Terminal Dashboard</h2>
            </div>

            <div className={`border ${borderColor} p-4 space-y-3`}>
              <p className={`text-xs ${mutedText}`}>--- KEY METRICS ---</p>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3 sm:gap-6">
                <div>
                  <p className={`text-xs ${mutedText}`}>TOTAL_VISITORS</p>
                  <p className="text-2xl font-bold">{summary.uniqueVisitors.toLocaleString()}</p>
                </div>
                <div>
                  <p className={`text-xs ${mutedText}`}>AVG_SESSION_DUR</p>
                  <p className="text-2xl font-bold">{formatDuration(summary.avgDwellSeconds)}</p>
                </div>
                <div>
                  <p className={`text-xs ${mutedText}`}>P95_LATENCY</p>
                  <p className="text-2xl font-bold">{summary.p95LatencyMs}ms</p>
                </div>
              </div>
            </div>

            <div className={`border ${borderColor} p-4 space-y-3`}>
              <p className={`text-xs ${mutedText}`}>--- TOP PERFORMING NOTES ---</p>
              <div className="text-xs">
                <div className={`flex gap-4 py-1 ${mutedText} border-b ${borderColor}`}>
                  <span className="w-8">[#]</span>
                  <span className="flex-1">NOTE_TITLE</span>
                  <span className="w-16 text-right">VIEWS</span>
                  <span className="w-20 text-right">DWELL_TIME</span>
                </div>
                {summary.topContent.map((post, index) => (
                  <div key={`${post.type}-${post.slug}`} className={`flex gap-4 py-1.5 ${hoverBg}`}>
                    <span className={`w-8 ${mutedText}`}>[{index + 1}]</span>
                    <span className="flex-1 truncate">{post.title}</span>
                    <span className="w-16 text-right">{post.views}</span>
                    <span className={`w-20 text-right ${mutedText}`}>{formatDuration(post.avgDwellSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border ${borderColor} p-4 space-y-3`}>
              <p className={`text-xs ${mutedText}`}>--- TRAFFIC SOURCES ---</p>
              <div className="space-y-2 text-xs">
                {referrerRows.map((source) => (
                  <div key={source.label} className="flex items-center gap-3">
                    <span className="w-28 truncate">{source.label}</span>
                    <span className={mutedText}>{renderProgressBar(source.percentage)}</span>
                    <span className="w-10 text-right">{source.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className={`border ${borderColor} p-4 space-y-3`}>
                  <p className={`text-xs ${mutedText}`}>--- BROWSER STATS ---</p>
                  <div className="space-y-1.5 text-xs">
                  {browserRows.map((browser) => (
                    <div key={browser.label} className="flex items-center gap-2">
                      <span className="w-16">{browser.label}</span>
                      <span className={mutedText}>{renderProgressBar(browser.percentage, 12)}</span>
                      <span className="w-8 text-right">{browser.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`border ${borderColor} p-4 space-y-3`}>
                <p className={`text-xs ${mutedText}`}>--- DEVICE TYPES ---</p>
                <div className="space-y-1.5 text-xs">
                  {deviceRows.map((device) => (
                    <div key={device.label} className="flex items-center gap-2">
                      <span className="w-16">{device.label}</span>
                      <span className={mutedText}>{renderProgressBar(device.percentage, 12)}</span>
                      <span className="w-8 text-right">{device.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`border ${borderColor} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${mutedText}`}>--- SYSTEM DIAGNOSTICS ---</p>
                <span className={`text-xs ${mutedText}`}>[{readiness.cards.length}]</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {readiness.cards.map((card) => (
                  <div key={card.key} className={`space-y-1 px-1 py-1 ${hoverBg}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-36 truncate">{card.label}</span>
                      <span className={card.status === "ready" ? accentText : mutedText}>[{card.status.replace("_", " ")}]</span>
                      <span className="flex-1 truncate">{card.value}</span>
                    </div>
                    <p className={`pl-0 text-[11px] sm:pl-[9.75rem] ${mutedText}`}>{card.detail}</p>
                  </div>
                ))}
              </div>
              <p className={`text-xs ${mutedText}`}>
                {readiness.lastWorkerActivity
                  ? `last_worker :: ${readiness.lastWorkerActivity.label} :: ${readiness.lastWorkerActivity.source}`
                  : "last_worker :: no persisted activity"}
              </p>
            </div>

            <div data-v0-service-log className={`border ${borderColor} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${mutedText}`}>--- SERVICE LOG ---</p>
                <span className={`text-xs ${mutedText}`}>[{readiness.serviceLog.length}]</span>
              </div>

              {readiness.serviceLog.length === 0 ? (
                <p className={`text-xs ${mutedText}`}>No recent service activity has been recorded yet.</p>
              ) : (
                <div className="space-y-1.5 text-xs">
                  {readiness.serviceLog.map((entry) => (
                    <div key={entry.id} className={`space-y-1 px-1 py-1 ${hoverBg}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0">{new Date(entry.occurredAt).toISOString().slice(11, 19)}</span>
                        <span className={entry.status === "success" ? accentText : entry.status === "error" ? "text-[#FF3333]" : mutedText}>
                          [{entry.status}]
                        </span>
                        <span className="w-40 truncate">{entry.label}</span>
                        <span className="flex-1 truncate">{entry.source}</span>
                      </div>
                      <p className={`pl-0 text-[11px] sm:pl-[17rem] ${mutedText}`}>{entry.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div data-v0-admin-performance className={`border ${borderColor} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs ${mutedText}`}>--- PERFORMANCE DIAGNOSTICS ---</p>
                <span className={`text-xs ${mutedText}`}>{new Date(performance.measuredAt).toLocaleTimeString()}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {performance.timings.map((metric) => (
                  <div key={metric.key} className={`space-y-1 px-1 py-1 ${hoverBg}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-36 truncate">{metric.label}</span>
                      <span className={metric.status === "measured" ? accentText : mutedText}>
                        [{metric.status === "measured" ? "measured" : "skipped"}]
                      </span>
                      <span className="w-20 text-right">{formatLatency(metric.durationMs)}</span>
                      <span className="flex-1 truncate">{metric.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`border-t pt-3 ${borderColor}`}>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-36 truncate">RECENT_NAV</span>
                    <span className={accentText}>[client]</span>
                    <span className="w-20 text-right">
                      {formatLatency(clientPerformance?.recentNavigation?.durationMs ?? null)}
                    </span>
                    <span className="flex-1 truncate">
                      {clientPerformance?.recentNavigation
                        ? `${clientPerformance.recentNavigation.route} @ ${new Date(clientPerformance.recentNavigation.measuredAt).toLocaleTimeString()}`
                        : "No recorded admin route transition yet."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-36 truncate">PANEL_HANDOFF</span>
                    <span className={accentText}>[client]</span>
                    <span className="w-20 text-right">
                      {formatLatency(clientPerformance?.recentRuntimeHandoff?.durationMs ?? null)}
                    </span>
                    <span className="flex-1 truncate">
                      {clientPerformance?.recentRuntimeHandoff
                        ? `${clientPerformance.recentRuntimeHandoff.route} @ ${new Date(clientPerformance.recentRuntimeHandoff.measuredAt).toLocaleTimeString()}`
                        : "No recorded admin runtime handoff yet."}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-36 truncate">PREFETCH_MODE</span>
                    <span className={accentText}>[live]</span>
                    <span className="w-20 text-right">ready</span>
                    <span className="flex-1 truncate">
                      {clientPerformance?.navPrefetchStrategy ?? performance.navPrefetchStrategy}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                {performance.notes.map((note, index) => (
                  <p key={index} className={mutedText}>
                    {note}
                  </p>
                ))}
              </div>
            </div>
        </div>
      </div>
    </AdminShell>
  )
}
