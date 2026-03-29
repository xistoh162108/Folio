import { AnalyticsScreen } from "@/components/v0/admin/analytics-screen"
import { getAnalyticsDashboardSummary } from "@/lib/data/analytics"
import { getAdminPerformanceDashboard } from "@/lib/ops/admin-performance"
import { getAdminReadinessDashboard } from "@/lib/ops/readiness"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function AnalyticsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [summary, readiness, performance, isDarkMode] = await Promise.all([
    getAnalyticsDashboardSummary(),
    getAdminReadinessDashboard(),
    getAdminPerformanceDashboard(),
    getV0ThemeIsDark(),
  ])

  return (
    <AnalyticsScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      performance={performance}
      summary={summary}
      readiness={readiness}
    />
  )
}
