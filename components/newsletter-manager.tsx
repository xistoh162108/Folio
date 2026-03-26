"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createCampaign, retryDelivery, sendTestCampaign, startCampaign } from "@/lib/actions/newsletter.actions"
import type { CampaignSummaryDTO, DeliveryRowDTO } from "@/lib/contracts/newsletter"

interface NewsletterManagerProps {
  topics: { id: string; name: string; normalizedName: string }[]
  campaigns: CampaignSummaryDTO[]
  deliveries: DeliveryRowDTO[]
  activeSubscriberCount: number
  migrationReady: boolean
  testEmail?: string
}

export function NewsletterManager({
  topics,
  campaigns,
  deliveries,
  activeSubscriberCount,
  migrationReady,
  testEmail = "",
}: NewsletterManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("<h1>Hello from xistoh.log</h1><p>Write your campaign here.</p>")
  const [text, setText] = useState("Hello from xistoh.log")
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["all-seeds"])
  const [testTarget, setTestTarget] = useState(testEmail)

  const selectedTopicNames = useMemo(() => {
    const names = topics
      .filter((topic) => selectedTopics.includes(topic.normalizedName))
      .map((topic) => topic.name)

    return names.length > 0 ? names : ["All Seeds"]
  }, [selectedTopics, topics])

  const toggleTopic = (normalizedName: string) => {
    setSelectedTopics((current) => {
      if (normalizedName === "all-seeds") {
        return ["all-seeds"]
      }

      const withoutAll = current.filter((topic) => topic !== "all-seeds")
      if (withoutAll.includes(normalizedName)) {
        const next = withoutAll.filter((topic) => topic !== normalizedName)
        return next.length > 0 ? next : ["all-seeds"]
      }

      return [...withoutAll, normalizedName]
    })
  }

  const runWithRefresh = (
    task: () => Promise<{ success: boolean; error?: string; message?: string } | { success: boolean; campaignId?: string; error?: string; message?: string }>,
  ) => {
    setMessage(null)
    startTransition(async () => {
      const result = await task()
      if (!result.success) {
        setMessage(result.error ?? "Operation failed.")
        return
      }

      setMessage(result.message ?? "Completed.")
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {!migrationReady ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          Newsletter tables are not live in the current database yet. Apply the latest Prisma migrations to enable campaign storage and worker processing.
        </div>
      ) : null}

      {message ? <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-300">{message}</div> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Active subscribers</p>
          <p className="mt-3 text-3xl font-semibold text-white">{activeSubscriberCount}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Campaigns</p>
          <p className="mt-3 text-3xl font-semibold text-white">{campaigns.length}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Recent deliveries</p>
          <p className="mt-3 text-3xl font-semibold text-white">{deliveries.length}</p>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Newsletter</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Compose campaign</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggleTopic(topic.normalizedName)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selectedTopics.includes(topic.normalizedName)
                  ? "border-[#D4FF00]/50 text-[#D4FF00]"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>

        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Campaign subject"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
        />
        <textarea
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          rows={10}
          className="w-full rounded-3xl border border-white/10 bg-black/40 px-4 py-4 font-mono text-sm text-white outline-none focus:border-[#D4FF00]/40"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder="Plain text fallback"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
        />

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={testTarget}
            onChange={(event) => setTestTarget(event.target.value)}
            placeholder="test@example.com"
            className="min-w-[260px] flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runWithRefresh(() =>
                sendTestCampaign({
                  email: testTarget,
                  subject,
                  html,
                  text,
                }),
              )
            }
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-[#D4FF00]/40 hover:text-[#D4FF00] disabled:opacity-50"
          >
            Send test
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runWithRefresh(() =>
                createCampaign({
                  subject,
                  html,
                  text,
                  topics: selectedTopics,
                }),
              )
            }
            className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:opacity-50"
          >
            Create campaign
          </button>
        </div>

        <p className="text-xs text-zinc-500">Audience filters: {selectedTopicNames.join(", ")}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Campaigns</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Queue control</h3>
          </div>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-zinc-500">No campaigns yet.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-white">{campaign.subject}</p>
                      <div className="flex flex-wrap gap-2">
                        {campaign.topics.map((topic) => (
                          <span key={topic} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400">
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-zinc-500">
                        {campaign.sentCount}/{campaign.deliveryCount} sent, {campaign.failedCount} failed
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
                        {campaign.status}
                      </span>
                      <button
                        type="button"
                        disabled={isPending || campaign.status === "SENDING" || campaign.deliveryCount === 0}
                        onClick={() => runWithRefresh(() => startCampaign({ campaignId: campaign.id }))}
                        className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:opacity-50"
                      >
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Deliveries</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Recent status</h3>
          </div>
          <div className="space-y-3">
            {deliveries.length === 0 ? (
              <p className="text-sm text-zinc-500">No deliveries yet.</p>
            ) : (
              deliveries.map((delivery) => (
                <div key={delivery.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{delivery.email}</p>
                      <p className="text-xs text-zinc-500">{delivery.campaignId}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs uppercase tracking-[0.18em] text-zinc-300">
                      {delivery.status}
                    </span>
                  </div>
                  {delivery.errorMessage ? <p className="mt-3 text-xs text-red-300">{delivery.errorMessage}</p> : null}
                  {delivery.status === "FAILED" ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runWithRefresh(() => retryDelivery(delivery.id))}
                      className="mt-3 rounded-full border border-red-500/30 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:opacity-50"
                    >
                      Retry delivery
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
