import { NewsletterManager } from "@/components/newsletter-manager"
import { getSession } from "@/lib/auth"
import { getNewsletterDashboardData } from "@/lib/data/newsletter"

export default async function AdminNewsletterPage() {
  const [session, dashboard] = await Promise.all([getSession(), getNewsletterDashboardData()])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Newsletter</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Campaign operations</h2>
      </div>

      <NewsletterManager
        topics={dashboard.topics}
        campaigns={dashboard.campaigns}
        deliveries={dashboard.deliveries}
        activeSubscriberCount={dashboard.activeSubscriberCount}
        migrationReady={dashboard.migrationReady}
        testEmail={session?.user?.email ?? ""}
      />
    </div>
  )
}
