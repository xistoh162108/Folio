import { getSession } from "@/lib/auth"
import { getAdminReadinessDashboard } from "@/lib/ops/readiness"

export const dynamic = "force-dynamic"

function getStatusStyles(status: "ready" | "not_ready" | "unknown") {
  if (status === "ready") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
  }

  if (status === "not_ready") {
    return "border-red-500/30 bg-red-500/10 text-red-200"
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200"
}

export default async function AdminSettingsPage() {
  const [session, readiness] = await Promise.all([getSession(), getAdminReadinessDashboard()])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Settings</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Provider readiness</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Read-only operational status for database, auth, storage, email, webhook, worker routes, and last recorded worker activity.
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Logged-in administrator: <span className="text-zinc-300">{session?.user.email ?? "unknown"}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {readiness.cards.map((card) => (
          <article key={card.key} className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{card.label}</p>
                <p className="mt-3 text-xl font-semibold text-white">{card.value}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${getStatusStyles(card.status)}`}>
                {card.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5 text-sm leading-6 text-zinc-400">
        This page does not mutate any state. If a provider is missing in production, the corresponding card should remain marked as not ready.
      </div>
    </div>
  )
}
