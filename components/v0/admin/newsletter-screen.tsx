"use client"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { V0NewsletterManager } from "@/components/v0/admin/newsletter-manager"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { NewsletterDashboardData } from "@/lib/contracts/newsletter"

interface NewsletterScreenProps {
  dashboard: NewsletterDashboardData
  testEmail?: string
  isDarkMode?: boolean
  brandLabel?: string
  initialView?: "compose" | "subscribers" | "preview"
}

export function NewsletterScreen({
  dashboard,
  testEmail = "",
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  initialView = "compose",
}: NewsletterScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  return (
    <AdminShell currentSection="newsletter" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="min-h-full p-4 pb-10 sm:p-6 md:h-full md:min-h-0 md:overflow-y-auto">
        <V0NewsletterManager dashboard={dashboard} initialView={initialView} isDarkMode={isDarkMode} testEmail={testEmail} />
      </div>
    </AdminShell>
  )
}
