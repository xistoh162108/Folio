"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createCampaign, retryDelivery, sendTestCampaign, startCampaign } from "@/lib/actions/newsletter.actions"
import type { CampaignSummaryDTO, DeliveryRowDTO, NewsletterSubscriberRowDTO } from "@/lib/contracts/newsletter"

interface NewsletterManagerProps {
  topics: { id: string; name: string; normalizedName: string }[]
  subscribers: NewsletterSubscriberRowDTO[]
  campaigns: CampaignSummaryDTO[]
  deliveries: DeliveryRowDTO[]
  activeSubscriberCount: number
  migrationReady: boolean
  testEmail?: string
  isDarkMode?: boolean
}

type EditorMode = "richtext" | "html"
type ViewMode = "compose" | "subscribers" | "preview"
type PreviewDevice = "desktop" | "mobile"

const ALL_TOPIC = "all-seeds"

function buildHtmlFromPlainText(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return "<div style=\"font-family: monospace; padding: 20px;\"><p>Your content here...</p></div>"
  }

  return `<div style="font-family: monospace; padding: 20px;">${paragraphs
    .map((paragraph) => `<p>${paragraph.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
    .join("")}</div>`
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "--"
  }

  return new Date(value).toISOString().slice(0, 10)
}

function generateProgressBar(current: number, total: number, width = 10) {
  const ratio = total > 0 ? current / total : 0
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)))
  const empty = width - filled
  return `[${"=".repeat(filled)}${"-".repeat(empty)}]`
}

export function V0NewsletterManager({
  topics,
  subscribers,
  campaigns,
  deliveries,
  activeSubscriberCount,
  migrationReady,
  testEmail = "",
  isDarkMode = true,
}: NewsletterManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>("compose")
  const [editorMode, setEditorMode] = useState<EditorMode>("richtext")
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([ALL_TOPIC])
  const [subject, setSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [htmlBody, setHtmlBody] = useState(`<div style="font-family: monospace; padding: 20px;">
  <h1>Newsletter Title</h1>
  <p>Your content here...</p>
</div>`)
  const [message, setMessage] = useState<string | null>(null)

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"
  const accentColor = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const accentBorder = isDarkMode ? "border-[#D4FF00]" : "border-[#3F5200]"
  const panelButtonClass = `v0-control-button border ${borderColor} ${hoverBg}`
  const compactButtonClass = `v0-control-button-compact border ${borderColor} ${hoverBg}`
  const fieldClass = `v0-control-field ${borderColor}`

  const topicRows = useMemo(() => {
    const normalized = new Map(topics.map((topic) => [topic.normalizedName, topic.name]))
    if (!normalized.has(ALL_TOPIC)) {
      normalized.set(ALL_TOPIC, "All Seeds")
    }

    return [...normalized.entries()].map(([normalizedName, name]) => ({
      normalizedName,
      name,
    }))
  }, [topics])

  const selectedTopicNames = useMemo(() => {
    return topicRows
      .filter((topic) => selectedTopics.includes(topic.normalizedName))
      .map((topic) => topic.name)
  }, [selectedTopics, topicRows])

  const targetSubscribers = useMemo(() => {
    if (selectedTopics.includes(ALL_TOPIC)) {
      return subscribers
    }

    const selectedNames = selectedTopicNames.filter((name) => name !== "All Seeds")
    return subscribers.filter(
      (subscriber) =>
        subscriber.topics.includes("All Seeds") || subscriber.topics.some((topic) => selectedNames.includes(topic)),
    )
  }, [selectedTopicNames, selectedTopics, subscribers])

  const subscriberTopicCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const topic of topicRows) {
      if (topic.name === "All Seeds") {
        counts.set(topic.name, activeSubscriberCount)
        continue
      }

      counts.set(
        topic.name,
        subscribers.filter((subscriber) => subscriber.topics.includes("All Seeds") || subscriber.topics.includes(topic.name)).length,
      )
    }

    return counts
  }, [activeSubscriberCount, subscribers, topicRows])

  const renderWithRefresh = (task: () => Promise<{ success: boolean; error?: string; message?: string }>) => {
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

  const toggleTopic = (normalizedName: string) => {
    if (normalizedName === ALL_TOPIC) {
      setSelectedTopics([ALL_TOPIC])
      return
    }

    setSelectedTopics((current) => {
      const withoutAll = current.filter((topic) => topic !== ALL_TOPIC)
      if (withoutAll.includes(normalizedName)) {
        const next = withoutAll.filter((topic) => topic !== normalizedName)
        return next.length > 0 ? next : [ALL_TOPIC]
      }

      return [...withoutAll, normalizedName]
    })
  }

  const currentHtml = editorMode === "html" ? htmlBody : buildHtmlFromPlainText(emailBody)
  const currentText = emailBody.trim() || stripHtml(htmlBody)

  return (
    <div className="space-y-6 font-mono">
      <div>
        <p className={`text-xs ${mutedText}`}>// newsletter campaign</p>
        <h2 className="text-lg mt-1">Email Campaign Manager</h2>
      </div>

      {!migrationReady ? (
        <div className={`border ${borderColor} p-4 text-xs`}>
          <p className={accentColor}>[MIGRATION REQUIRED]</p>
          <p className={`mt-2 ${mutedText}`}>
            Newsletter campaign and delivery tables are not fully available in the current database.
          </p>
        </div>
      ) : null}

      {message ? (
        <div className={`border ${borderColor} p-4 text-xs ${message.startsWith("[") ? "" : accentColor}`}>{message}</div>
      ) : null}

      <div className={`flex border-b ${borderColor}`}>
        {(["compose", "subscribers", "preview"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`v0-control-tab ${
              viewMode === mode ? `${activeBg} border-b-2 ${isDarkMode ? "border-white" : "border-black"}` : hoverBg
            }`}
          >
            {mode === "compose" && "[+] Compose"}
            {mode === "subscribers" && "Subscribers"}
            {mode === "preview" && "Preview"}
          </button>
        ))}
      </div>

      {viewMode === "compose" ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <p className={`text-xs ${mutedText}`}>// recipients</p>
            <div className="flex flex-wrap gap-2">
              {topicRows.map((topic) => (
                <button
                  key={topic.normalizedName}
                  onClick={() => toggleTopic(topic.normalizedName)}
                  className={`v0-control-inline-button transition-colors ${
                    selectedTopics.includes(topic.normalizedName)
                      ? `${accentBorder} ${accentColor}`
                      : `${borderColor} ${mutedText}`
                  }`}
                >
                  [{topic.name}]
                </button>
              ))}
            </div>
            <p className={`text-xs ${accentColor}`}>Target: {targetSubscribers.length} users</p>
          </section>

          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// subject</p>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject: Your newsletter title..."
              className={fieldClass}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={`text-xs ${mutedText}`}>// body</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditorMode("richtext")}
                  className={`v0-control-button-compact transition-colors ${
                    editorMode === "richtext" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                  }`}
                >
                  Rich Text
                </button>
                <button
                  onClick={() => setEditorMode("html")}
                  className={`v0-control-button-compact transition-colors ${
                    editorMode === "html" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                  }`}
                >
                  Raw HTML
                </button>
              </div>
            </div>

            {editorMode === "richtext" ? (
              <div className="space-y-2">
                <div className={`flex items-center gap-1 border ${borderColor} p-2`}>
                  {["B", "I", "U", "H1", "H2", "link", "list", "code"].map((buttonLabel) => (
                    <button key={buttonLabel} className={`v0-control-button-compact ${hoverBg}`}>
                      {buttonLabel}
                    </button>
                  ))}
                </div>
                <textarea
                  value={emailBody}
                  onChange={(event) => setEmailBody(event.target.value)}
                  placeholder="Start composing your email content..."
                  className={`v0-control-area h-48 ${borderColor}`}
                />
              </div>
            ) : (
              <div className="relative">
                <div className={`flex items-center justify-between px-4 py-2 border-t border-x ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
                  <span className={`text-xs ${mutedText}`}>// html</span>
                  <span className={`text-xs ${mutedText}`}>{htmlBody.length} chars</span>
                </div>
                <textarea
                  value={htmlBody}
                  onChange={(event) => setHtmlBody(event.target.value)}
                  spellCheck={false}
                  className={`v0-control-area h-48 border font-mono text-xs leading-6 ${borderColor} ${
                    isDarkMode ? "bg-[#1a1a1a] text-[#c0caf5]" : "bg-gray-50 text-gray-800"
                  }`}
                  style={{ tabSize: 2 }}
                />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  renderWithRefresh(() =>
                    sendTestCampaign({
                      email: testEmail,
                      subject,
                      html: currentHtml,
                      text: currentText,
                    }),
                  )
                }
                disabled={isPending || !subject || !testEmail}
                className={`${panelButtonClass} disabled:opacity-50`}
              >
                [ Send Test to Self ]
              </button>
              <button
                onClick={() =>
                  renderWithRefresh(async () => {
                    const created = await createCampaign({
                      subject,
                      html: currentHtml,
                      text: currentText,
                      topics: selectedTopics,
                    })

                    if (!created.success) {
                      return { success: false, error: created.error }
                    }

                    if (!created.campaignId) {
                      return { success: true, message: created.message ?? "Campaign created." }
                    }

                    const started = await startCampaign({ campaignId: created.campaignId })
                    if (!started.success) {
                      return { success: false, error: started.error }
                    }

                    return { success: true, message: started.message ?? "Campaign started." }
                  })
                }
                disabled={isPending || !subject || !migrationReady}
                className={`v0-control-button ${
                  isPending || !subject || !migrationReady
                    ? `border ${borderColor} ${mutedText} cursor-not-allowed`
                    : `${isDarkMode ? "bg-[#D4FF00] text-black" : "bg-[#3F5200] text-white"}`
                }`}
              >
                {isPending ? "Sending..." : `Launch Campaign (${targetSubscribers.length})`}
              </button>
            </div>

            <p className={`text-xs ${mutedText}`}>Test target: {testEmail || "missing session email"}</p>
          </section>

          <section className="space-y-3">
            <p className={`text-xs ${mutedText}`}>// queue</p>
            <div className="space-y-1">
              {campaigns.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-4 text-xs ${mutedText}`}>No campaigns yet.</div>
              ) : null}
              {campaigns.map((campaign) => (
                <div key={campaign.id} className={`border ${borderColor} px-3 py-3 space-y-2 ${hoverBg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span>{campaign.subject}</span>
                    <span className={campaign.status === "COMPLETED" ? accentColor : mutedText}>[{campaign.status.toLowerCase()}]</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {campaign.topics.map((topic) => (
                      <span key={topic} className={mutedText}>
                        [{topic}]
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className={mutedText}>
                      {generateProgressBar(campaign.sentCount + campaign.failedCount, campaign.deliveryCount)} {campaign.sentCount}/
                      {campaign.deliveryCount} sent
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={mutedText}>{formatDate(campaign.createdAt)}</span>
                      <button
                        onClick={() => renderWithRefresh(() => startCampaign({ campaignId: campaign.id }))}
                        disabled={isPending || campaign.deliveryCount === 0 || campaign.status === "SENDING"}
                        className={`${compactButtonClass} disabled:opacity-50`}
                      >
                        [start]
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className={`text-xs ${mutedText}`}>// deliveries</p>
            <div className="space-y-1">
              {deliveries.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-4 text-xs ${mutedText}`}>No deliveries yet.</div>
              ) : null}
              {deliveries.slice(0, 10).map((delivery) => (
                <div key={delivery.id} className={`border ${borderColor} px-3 py-3 space-y-2 ${hoverBg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span>{delivery.email}</span>
                    <span className={delivery.status === "SENT" ? accentColor : delivery.status === "FAILED" ? "text-red-400" : mutedText}>
                      [{delivery.status.toLowerCase()}]
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className={mutedText}>{delivery.campaignId}</span>
                    <div className="flex items-center gap-2">
                      <span className={mutedText}>{formatDate(delivery.sentAt ?? delivery.createdAt)}</span>
                      {delivery.status === "FAILED" ? (
                        <button
                          onClick={() => renderWithRefresh(() => retryDelivery(delivery.id))}
                          disabled={isPending}
                          className={`${compactButtonClass} disabled:opacity-50`}
                        >
                          [retry]
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {delivery.errorMessage ? <p className="text-xs text-red-400">{delivery.errorMessage}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {viewMode === "subscribers" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>Total</p>
              <p className="text-xl mt-1">{activeSubscriberCount}</p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>{topicRows[1]?.name ?? "Topic A"}</p>
              <p className="text-xl mt-1">{subscriberTopicCounts.get(topicRows[1]?.name ?? "") ?? 0}</p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>{topicRows[2]?.name ?? "Topic B"}</p>
              <p className="text-xl mt-1">{subscriberTopicCounts.get(topicRows[2]?.name ?? "") ?? 0}</p>
            </div>
          </div>

          <div className={`border ${borderColor}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Email</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Topics</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className={`border-b ${borderColor} ${hoverBg} transition-colors`}>
                    <td className="p-3 text-xs">{subscriber.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {subscriber.topics.map((topic) => (
                          <span key={topic} className={`text-xs ${mutedText}`}>
                            [{topic}]
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`p-3 text-xs ${mutedText}`}>{formatDate(subscriber.subscribedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {viewMode === "preview" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${mutedText}`}>// preview</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`v0-control-button-compact transition-colors ${
                  previewDevice === "desktop" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`v0-control-button-compact transition-colors ${
                  previewDevice === "mobile" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          <div className={`border ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-white"} overflow-hidden`}>
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor} ${isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>
              <span className={`text-xs ${mutedText}`}>From:</span>
              <span className="text-xs">{testEmail || "admin@xistoh.com"}</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor} ${isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>
              <span className={`text-xs ${mutedText}`}>Subject:</span>
              <span className="text-xs">{subject || "(No subject)"}</span>
            </div>

            <div className={`mx-auto p-6 ${previewDevice === "mobile" ? "max-w-[375px]" : "w-full"}`}>
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: currentHtml }} />
            </div>
          </div>

          <p className={`text-xs ${mutedText}`}>// {previewDevice === "mobile" ? "375px width" : "full width"} preview</p>
        </div>
      ) : null}
    </div>
  )
}
