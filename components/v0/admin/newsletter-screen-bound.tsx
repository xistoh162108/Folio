import { NewsletterScreen } from "@/components/v0/admin/newsletter-screen"
import { getSession } from "@/lib/auth"
import { getNewsletterDashboardData } from "@/lib/data/newsletter"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function NewsletterScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [session, dashboard, isDarkMode] = await Promise.all([getSession(), getNewsletterDashboardData(), getV0ThemeIsDark()])

  return <NewsletterScreen brandLabel={brandLabel} dashboard={dashboard} isDarkMode={isDarkMode} testEmail={session?.user?.email ?? ""} />
}
