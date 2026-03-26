import { getAnalyticsDashboardSummary } from "@/lib/data/analytics"

export default async function AdminAnalyticsPage() {
  const summary = await getAnalyticsDashboardSummary()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Analytics</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Operational overview</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">Pageviews</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.pageviews}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">Avg dwell time</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.avgDwellSeconds}s</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">Realtime visitors</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.realtimeVisitors}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">P95 latency</p>
          <p className="mt-3 text-3xl font-semibold text-white">{summary.p95LatencyMs}ms</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">Top referrer</p>
          <p className="mt-3 text-xl font-semibold text-white">{summary.referrers[0]?.source ?? "Direct"}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-sm text-zinc-500">Top browser</p>
          <p className="mt-3 text-xl font-semibold text-white">{summary.browsers[0]?.label ?? "Unknown"}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Top content</h3>
          <div className="mt-4 space-y-3">
            {summary.topContent.map((post) => (
              <div key={`${post.type}-${post.slug}`} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{post.title}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{post.type}</p>
                </div>
                <p className="text-sm text-zinc-300">{post.views} views</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
            <h3 className="text-lg font-semibold text-white">Referrers</h3>
            <div className="mt-4 space-y-3">
              {summary.referrers.map((row) => (
                <div key={row.source} className="flex items-center justify-between text-sm text-zinc-300">
                  <span>{row.source}</span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
            <h3 className="text-lg font-semibold text-white">Devices</h3>
            <div className="mt-4 space-y-3">
              {summary.devices.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm text-zinc-300">
                  <span>{row.label}</span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
