import { AnalyticsScreen } from "@/components/v0/admin/analytics-screen"
import { getAnalyticsDashboardSummary } from "@/lib/data/analytics"
import { getAdminReadinessDashboard } from "@/lib/ops/readiness"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function AnalyticsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [summary, readiness, isDarkMode] = await Promise.all([
    getAnalyticsDashboardSummary(),
    getAdminReadinessDashboard(),
    getV0ThemeIsDark(),
  ])

  return <AnalyticsScreen brandLabel={brandLabel} isDarkMode={isDarkMode} summary={summary} readiness={readiness} />
}
