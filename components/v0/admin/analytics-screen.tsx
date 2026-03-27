"use client"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { renderProgressBar } from "@/components/v0/fixtures"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { AnalyticsDashboardSummary, DeviceBreakdownRow, ReferrerBreakdownRow } from "@/lib/contracts/analytics"
import type { ReadinessDashboard } from "@/lib/ops/readiness"

interface AnalyticsScreenProps {
  summary: AnalyticsDashboardSummary
  readiness: ReadinessDashboard
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

export function AnalyticsScreen({
  summary,
  readiness,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: AnalyticsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const accentText = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const referrerRows = toPercentageRows(summary.referrers, (row) => row.source)
  const browserRows = toPercentageRows(summary.browsers, (row) => row.label)
  const deviceRows = toPercentageRows(summary.devices, (row) => row.label)

  return (
    <AdminShell currentSection="overview" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="h-full p-6 overflow-y-auto">
        <div className="space-y-6 font-mono">
            <div>
              <p className={`text-xs ${mutedText}`}>// analytics</p>
              <h2 className="text-lg mt-1">Terminal Dashboard</h2>
            </div>

            <div className={`border ${borderColor} p-4 space-y-3`}>
              <p className={`text-xs ${mutedText}`}>--- KEY METRICS ---</p>
              <div className="grid grid-cols-3 gap-6 text-sm">
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

            <div className="grid grid-cols-2 gap-4">
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
                  <div key={card.key} className={`flex items-center gap-3 ${hoverBg} px-1 py-1`}>
                    <span className="w-36 truncate">{card.label}</span>
                    <span className={card.status === "ready" ? accentText : mutedText}>[{card.status.replace("_", " ")}]</span>
                    <span className="flex-1 truncate">{card.value}</span>
                  </div>
                ))}
              </div>
              <p className={`text-xs ${mutedText}`}>
                {readiness.lastWorkerActivity
                  ? `last_worker :: ${readiness.lastWorkerActivity.label} :: ${readiness.lastWorkerActivity.source}`
                  : "last_worker :: no persisted activity"}
              </p>
            </div>
        </div>
      </div>
    </AdminShell>
  )
}
