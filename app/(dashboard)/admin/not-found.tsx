import { AdminFallbackContent } from "@/components/v0/admin/admin-fallback-content"
import { AdminShell } from "@/components/v0/admin/admin-shell"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export default async function AdminNotFound() {
  const isDarkMode = await getV0ThemeIsDark()

  return (
    <AdminShell currentSection={null} isDarkMode={isDarkMode}>
      <AdminFallbackContent
        initialIsDarkMode={isDarkMode}
        title="Route Missing"
        code="[ ROUTE_NOT_FOUND ]"
        message="The requested admin surface does not exist in the current cutover set."
        actions={[
          { label: "[analytics]", href: "/admin/analytics" },
          { label: "[manage posts]", href: "/admin/posts" },
        ]}
      />
    </AdminShell>
  )
}
