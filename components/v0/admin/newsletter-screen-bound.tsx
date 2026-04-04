import { NewsletterScreen } from "@/components/v0/admin/newsletter-screen"
import { getSession } from "@/lib/auth"
import { getNewsletterDashboardData } from "@/lib/data/newsletter"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function NewsletterScreenBound({
  brandLabel = "xistoh.log",
  searchParams = Promise.resolve({}),
}: {
  brandLabel?: string
  searchParams?: Promise<Record<string, string | string[] | undefined>>
} = {}) {
  const resolved = await searchParams
  const campaignId = typeof resolved.campaign === "string" ? resolved.campaign : null
  const initialView =
    resolved.view === "subscribers" || resolved.view === "preview" || resolved.view === "compose"
      ? resolved.view
      : "compose"
  const subscribersPage = typeof resolved.subscribersPage === "string" ? Number.parseInt(resolved.subscribersPage, 10) : undefined
  const campaignsPage = typeof resolved.campaignsPage === "string" ? Number.parseInt(resolved.campaignsPage, 10) : undefined
  const deliveriesPage = typeof resolved.deliveriesPage === "string" ? Number.parseInt(resolved.deliveriesPage, 10) : undefined

  const [session, dashboard, isDarkMode] = await Promise.all([
    getSession(),
    getNewsletterDashboardData({
      campaignId,
      subscribersPage,
      campaignsPage,
      deliveriesPage,
    }),
    getV0ThemeIsDark(),
  ])

  return (
    <NewsletterScreen
      brandLabel={brandLabel}
      dashboard={dashboard}
      initialView={initialView}
      isDarkMode={isDarkMode}
      testEmail={session?.user?.email ?? ""}
    />
  )
}
