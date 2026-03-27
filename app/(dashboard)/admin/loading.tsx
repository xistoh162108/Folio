import { AdminShell } from "@/components/v0/admin/admin-shell"
import { AdminFallbackContent } from "@/components/v0/admin/admin-fallback-content"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export default async function AdminLoading() {
  const isDarkMode = await getV0ThemeIsDark()

  return (
    <AdminShell
      currentSection={null}
      isDarkMode={isDarkMode}
      isPageLoading
      loadingText="cd /admin && [LOADING...]"
    >
      <AdminFallbackContent initialIsDarkMode={isDarkMode} code="[ LOADING ADMIN SURFACE ]" />
    </AdminShell>
  )
}
