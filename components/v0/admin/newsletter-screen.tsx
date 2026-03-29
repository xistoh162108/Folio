"use client"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { V0NewsletterManager } from "@/components/v0/admin/newsletter-manager"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { NewsletterDashboardData } from "@/lib/data/newsletter"

interface NewsletterScreenProps {
  dashboard: NewsletterDashboardData
  testEmail?: string
  isDarkMode?: boolean
  brandLabel?: string
}

export function NewsletterScreen({
  dashboard,
  testEmail = "",
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: NewsletterScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  return (
    <AdminShell currentSection="newsletter" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="min-h-full p-4 sm:p-6 md:h-full md:overflow-y-auto">
        <V0NewsletterManager
          activeSubscriberCount={dashboard.activeSubscriberCount}
          campaigns={dashboard.campaigns}
          deliveries={dashboard.deliveries}
          isDarkMode={isDarkMode}
          migrationReady={dashboard.migrationReady}
          subscribers={dashboard.subscribers}
          testEmail={testEmail}
          topics={dashboard.topics}
        />
      </div>
    </AdminShell>
  )
}
