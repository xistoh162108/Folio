"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  adminUnsubscribeSubscriber,
  createCampaign,
  editDeliveryRecipient,
  moveDeliveryInQueue,
  removeDeliveryFromQueue,
  retryDelivery,
  sendTestCampaign,
  startCampaign,
} from "@/lib/actions/newsletter.actions"
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
type RecipientMode = "topics" | "selected"
type ImagePosition = "top" | "middle" | "bottom"

const ALL_TOPIC = "all-seeds"
const PAGE_SIZE = 12

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--"
  return new Date(value).toISOString().slice(0, 10)
}

function generateProgressBar(current: number, total: number, width = 10) {
  const ratio = total > 0 ? current / total : 0
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)))
  return `[${"=".repeat(filled)}${"-".repeat(width - filled)}]`
}

function paged<T>(rows: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / size))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const start = (safePage - 1) * size
  return { rows: rows.slice(start, start + size), totalPages, page: safePage }
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
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("topics")
  const [selectedTopics, setSelectedTopics] = useState<string[]>([ALL_TOPIC])
  const [selectedSubscriberIds, setSelectedSubscriberIds] = useState<string[]>([])
  const [subject, setSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [htmlBody, setHtmlBody] = useState(`<div style="font-family: monospace; padding: 20px;"><h1>Newsletter Title</h1><p>Your content here...</p></div>`)
  const [attachments, setAttachments] = useState<Array<{ label: string; url: string }>>([])
  const [attachmentLabel, setAttachmentLabel] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePosition, setImagePosition] = useState<ImagePosition>("middle")
  const [inlineImages, setInlineImages] = useState<Array<{ url: string; position: ImagePosition }>>([])
  const [composeMessage, setComposeMessage] = useState<string | null>(null)
  const [subscriberPage, setSubscriberPage] = useState(1)
  const [campaignPage, setCampaignPage] = useState(1)
  const [deliveryPage, setDeliveryPage] = useState(1)

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
    if (!normalized.has(ALL_TOPIC)) normalized.set(ALL_TOPIC, "All Seeds")
    return [...normalized.entries()].map(([normalizedName, name]) => ({ normalizedName, name }))
  }, [topics])

  const selectedTopicNames = useMemo(
    () => topicRows.filter((topic) => selectedTopics.includes(topic.normalizedName)).map((topic) => topic.name),
    [selectedTopics, topicRows],
  )

  const topicTargetSubscribers = useMemo(() => {
    if (selectedTopics.includes(ALL_TOPIC)) return subscribers
    const selectedNames = selectedTopicNames.filter((name) => name !== "All Seeds")
    return subscribers.filter(
      (subscriber) =>
        subscriber.topics.includes("All Seeds") || subscriber.topics.some((topic) => selectedNames.includes(topic)),
    )
  }, [selectedTopicNames, selectedTopics, subscribers])

  const targetSubscribers = recipientMode === "selected" ? subscribers.filter((s) => selectedSubscriberIds.includes(s.id)) : topicTargetSubscribers

  const subscriberTopicCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const topic of topicRows) {
      if (topic.name === "All Seeds") counts.set(topic.name, activeSubscriberCount)
      else counts.set(topic.name, subscribers.filter((s) => s.topics.includes("All Seeds") || s.topics.includes(topic.name)).length)
    }
    return counts
  }, [activeSubscriberCount, subscribers, topicRows])

  const renderWithRefresh = (task: () => Promise<{ success: boolean; error?: string; message?: string }>) => {
    setComposeMessage(null)
    startTransition(async () => {
      const result = await task()
      if (!result.success) return setComposeMessage(result.error ?? "Operation failed.")
      setComposeMessage(result.message ?? "Completed.")
      router.refresh()
    })
  }

  const currentHtml = useMemo(() => {
    const main = editorMode === "html" ? htmlBody : `<div style="font-family: monospace; padding: 20px;">${emailBody
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</p>`)
      .join("")}</div>`

    const imageHtml = (position: ImagePosition) =>
      inlineImages
        .filter((image) => image.position === position)
        .map((image) => `<p><img src="${image.url}" alt="newsletter image" style="max-width:100%;height:auto;" /></p>`)
        .join("")

    const attachmentHtml =
      attachments.length > 0
        ? `<hr/><p><strong>Attachments</strong></p><ul>${attachments.map((a) => `<li><a href="${a.url}">${a.label || a.url}</a></li>`).join("")}</ul>`
        : ""

    return `${imageHtml("top")}${main}${imageHtml("middle")}${attachmentHtml}${imageHtml("bottom")}`
  }, [attachments, editorMode, emailBody, htmlBody, inlineImages])

  const currentText = emailBody.trim() || stripHtml(currentHtml)

  const applyTextFormat = (kind: "bold" | "italic" | "underline" | "h1" | "h2") => {
    const textarea = document.getElementById("newsletter-richtext") as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = emailBody.slice(start, end) || "text"
    const mapped =
      kind === "bold"
        ? `**${selected}**`
        : kind === "italic"
          ? `*${selected}*`
          : kind === "underline"
            ? `<u>${selected}</u>`
            : kind === "h1"
              ? `\n# ${selected}\n`
              : `\n## ${selected}\n`
    const next = `${emailBody.slice(0, start)}${mapped}${emailBody.slice(end)}`
    setEmailBody(next)
  }

  const subscribersPaginated = paged(subscribers, subscriberPage, PAGE_SIZE)
  const campaignsPaginated = paged(campaigns, campaignPage, PAGE_SIZE)
  const deliveriesPaginated = paged(deliveries, deliveryPage, PAGE_SIZE)

  return (
    <div className="space-y-6 font-mono">
      <div>
        <p className={`text-xs ${mutedText}`}>// newsletter campaign</p>
        <h2 className="text-lg mt-1">Email Campaign Manager</h2>
      </div>

      {composeMessage ? <div className={`border ${borderColor} p-4 text-xs ${accentColor}`}>{composeMessage}</div> : null}

      <div className={`flex border-b ${borderColor}`}>
        {(["compose", "subscribers", "preview"] as ViewMode[]).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)} className={`v0-control-tab ${viewMode === mode ? `${activeBg} border-b-2` : hoverBg}`}>
            {mode}
          </button>
        ))}
      </div>

      {viewMode === "compose" ? (
        <div className="space-y-4">
          <div className="flex gap-2 text-xs">
            <button onClick={() => setRecipientMode("topics")} className={`${compactButtonClass} ${recipientMode === "topics" ? accentColor : mutedText}`}>[topics]</button>
            <button onClick={() => setRecipientMode("selected")} className={`${compactButtonClass} ${recipientMode === "selected" ? accentColor : mutedText}`}>[selected subscribers]</button>
          </div>

          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// recipients</p>
            <div className="flex flex-wrap gap-2">
              {topicRows.map((topic) => (
                <button key={topic.normalizedName} onClick={() => setSelectedTopics((current) => topic.normalizedName === ALL_TOPIC ? [ALL_TOPIC] : current.includes(topic.normalizedName) ? current.filter((name) => name !== topic.normalizedName) : [...current.filter((name) => name !== ALL_TOPIC), topic.normalizedName])} className={`v0-control-inline-button ${selectedTopics.includes(topic.normalizedName) ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`}`}>
                  [{topic.name}]
                </button>
              ))}
            </div>
            <p className={`text-xs ${accentColor}`}>Target: {targetSubscribers.length} users</p>
          </section>

          <input type="text" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" className={fieldClass} />

          <div className="space-y-2">
            <div className="flex gap-1">
              <button onClick={() => setEditorMode("richtext")} className={compactButtonClass}>Rich Text</button>
              <button onClick={() => setEditorMode("html")} className={compactButtonClass}>Raw HTML</button>
            </div>
            {editorMode === "richtext" ? (
              <>
                <div className={`flex items-center gap-1 border ${borderColor} p-2`}>
                  <button onClick={() => applyTextFormat("bold")} className={compactButtonClass}>B</button>
                  <button onClick={() => applyTextFormat("italic")} className={compactButtonClass}>I</button>
                  <button onClick={() => applyTextFormat("underline")} className={compactButtonClass}>U</button>
                  <button onClick={() => applyTextFormat("h1")} className={compactButtonClass}>H1</button>
                  <button onClick={() => applyTextFormat("h2")} className={compactButtonClass}>H2</button>
                </div>
                <textarea id="newsletter-richtext" value={emailBody} onChange={(event) => setEmailBody(event.target.value)} className={`v0-control-area h-40 ${borderColor}`} />
              </>
            ) : (
              <textarea value={htmlBody} onChange={(event) => setHtmlBody(event.target.value)} className={`v0-control-area h-40 ${borderColor}`} />
            )}
          </div>

          <div className={`border ${borderColor} p-3 space-y-2`}>
            <p className={`text-xs ${mutedText}`}>// attachments & images</p>
            <div className="flex gap-2">
              <input value={attachmentLabel} onChange={(e) => setAttachmentLabel(e.target.value)} placeholder="Attachment label" className={fieldClass} />
              <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." className={fieldClass} />
              <button className={compactButtonClass} onClick={() => { if (!attachmentUrl) return; setAttachments((c) => [...c, { label: attachmentLabel, url: attachmentUrl }]); setAttachmentLabel(""); setAttachmentUrl("") }}>[add file]</button>
            </div>
            <div className="flex gap-2">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image url" className={fieldClass} />
              <select value={imagePosition} onChange={(e) => setImagePosition(e.target.value as ImagePosition)} className={fieldClass}><option value="top">top</option><option value="middle">middle</option><option value="bottom">bottom</option></select>
              <button className={compactButtonClass} onClick={() => { if (!imageUrl) return; setInlineImages((c) => [...c, { url: imageUrl, position: imagePosition }]); setImageUrl("") }}>[add image]</button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => renderWithRefresh(() => sendTestCampaign({ email: testEmail, subject, html: currentHtml, text: currentText }))} disabled={isPending || !subject || !testEmail} className={`${panelButtonClass} disabled:opacity-50`}>[ Send Test to Self ]</button>
            <button onClick={() => renderWithRefresh(async () => {
              const created = await createCampaign({ subject, html: currentHtml, text: currentText, topics: selectedTopics, subscriberIds: recipientMode === "selected" ? selectedSubscriberIds : undefined })
              if (!created.success || !created.campaignId) return { success: created.success, error: created.error, message: created.message }
              return startCampaign({ campaignId: created.campaignId })
            })} disabled={isPending || !subject || !migrationReady} className={`${panelButtonClass} disabled:opacity-50`}>{isPending ? "Sending..." : `Launch Campaign (${targetSubscribers.length})`}</button>
            <button onClick={() => renderWithRefresh(async () => {
              if (selectedSubscriberIds.length !== 1) return { success: false, error: "Select exactly one subscriber first." }
              const created = await createCampaign({ subject, html: currentHtml, text: currentText, topics: [ALL_TOPIC], subscriberIds: selectedSubscriberIds })
              if (!created.success || !created.campaignId) return { success: created.success, error: created.error, message: created.message }
              return startCampaign({ campaignId: created.campaignId })
            })} className={panelButtonClass} disabled={isPending || selectedSubscriberIds.length !== 1 || !subject}>[ Send to selected subscriber ]</button>
          </div>

          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// queue (campaigns)</p>
            {campaignsPaginated.rows.map((campaign) => (
              <div key={campaign.id} className={`border ${borderColor} px-3 py-3 space-y-2`}>
                <div className="flex items-center justify-between text-xs"><span>{campaign.subject}</span><span className={mutedText}>[{campaign.status.toLowerCase()}]</span></div>
                <div className="flex items-center justify-between text-xs"><span>{generateProgressBar(campaign.sentCount + campaign.failedCount, campaign.deliveryCount)}</span><span>{formatDate(campaign.createdAt)}</span></div>
                <div className="flex gap-2">
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => startCampaign({ campaignId: campaign.id }))}>[start]</button>
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => startCampaign({ campaignId: campaign.id, resendMode: "unsent-only" }))}>[resend-unsent]</button>
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => startCampaign({ campaignId: campaign.id, resendMode: "all" }))}>[re-run all]</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 text-xs">
              <button onClick={() => setCampaignPage((p) => Math.max(1, p - 1))} className={compactButtonClass}>prev</button>
              <span className={mutedText}>{campaignsPaginated.page}/{campaignsPaginated.totalPages}</span>
              <button onClick={() => setCampaignPage((p) => Math.min(campaignsPaginated.totalPages, p + 1))} className={compactButtonClass}>next</button>
            </div>
          </section>

          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// deliveries</p>
            {deliveriesPaginated.rows.map((delivery) => (
              <div key={delivery.id} className={`border ${borderColor} px-3 py-2 space-y-2 ${hoverBg}`}>
                <div className="flex items-center justify-between text-xs"><span>{delivery.email}</span><span className={mutedText}>[{delivery.status}]</span></div>
                <div className="flex gap-2">
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => moveDeliveryInQueue(delivery.id, "up"))}>[↑]</button>
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => moveDeliveryInQueue(delivery.id, "down"))}>[↓]</button>
                  <button className={compactButtonClass} onClick={() => { const updated = prompt("Edit recipient email", delivery.email); if (updated) renderWithRefresh(() => editDeliveryRecipient(delivery.id, updated)) }}>[edit]</button>
                  <button className={compactButtonClass} onClick={() => renderWithRefresh(() => removeDeliveryFromQueue(delivery.id))}>[remove]</button>
                  {delivery.status === "FAILED" ? <button className={compactButtonClass} onClick={() => renderWithRefresh(() => retryDelivery(delivery.id))}>[retry]</button> : null}
                </div>
              </div>
            ))}
            <div className="flex gap-2 text-xs">
              <button onClick={() => setDeliveryPage((p) => Math.max(1, p - 1))} className={compactButtonClass}>prev</button>
              <span className={mutedText}>{deliveriesPaginated.page}/{deliveriesPaginated.totalPages}</span>
              <button onClick={() => setDeliveryPage((p) => Math.min(deliveriesPaginated.totalPages, p + 1))} className={compactButtonClass}>next</button>
            </div>
          </section>
        </div>
      ) : null}

      {viewMode === "subscribers" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`border ${borderColor} p-4`}><p className={`text-xs ${mutedText}`}>Total</p><p className="text-xl mt-1">{activeSubscriberCount}</p></div>
            <div className={`border ${borderColor} p-4`}><p className={`text-xs ${mutedText}`}>{topicRows[1]?.name ?? "Topic A"}</p><p className="text-xl mt-1">{subscriberTopicCounts.get(topicRows[1]?.name ?? "") ?? 0}</p></div>
            <div className={`border ${borderColor} p-4`}><p className={`text-xs ${mutedText}`}>{topicRows[2]?.name ?? "Topic B"}</p><p className="text-xl mt-1">{subscriberTopicCounts.get(topicRows[2]?.name ?? "") ?? 0}</p></div>
          </div>

          <div className={`border ${borderColor}`}>
            <table className="w-full text-sm">
              <thead><tr className={`border-b ${borderColor}`}><th className={`p-3 text-left text-xs ${mutedText}`}>Select</th><th className={`p-3 text-left text-xs ${mutedText}`}>Email</th><th className={`p-3 text-left text-xs ${mutedText}`}>Topics</th><th className={`p-3 text-left text-xs ${mutedText}`}>Actions</th></tr></thead>
              <tbody>
                {subscribersPaginated.rows.map((subscriber) => (
                  <tr key={subscriber.id} className={`border-b ${borderColor}`}>
                    <td className="p-3"><input type="checkbox" checked={selectedSubscriberIds.includes(subscriber.id)} onChange={() => setSelectedSubscriberIds((current) => current.includes(subscriber.id) ? current.filter((id) => id !== subscriber.id) : [...current, subscriber.id])} /></td>
                    <td className="p-3 text-xs">{subscriber.email}</td>
                    <td className="p-3 text-xs">{subscriber.topics.join(", ")}</td>
                    <td className="p-3 text-xs"><button className={compactButtonClass} onClick={() => renderWithRefresh(() => adminUnsubscribeSubscriber(subscriber.id))}>[admin-unsubscribe]</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 text-xs">
            <button onClick={() => setSubscriberPage((p) => Math.max(1, p - 1))} className={compactButtonClass}>prev</button>
            <span className={mutedText}>{subscribersPaginated.page}/{subscribersPaginated.totalPages}</span>
            <button onClick={() => setSubscriberPage((p) => Math.min(subscribersPaginated.totalPages, p + 1))} className={compactButtonClass}>next</button>
          </div>
        </div>
      ) : null}

      {viewMode === "preview" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><p className={`text-xs ${mutedText}`}>// preview</p><div className="flex gap-1"><button onClick={() => setPreviewDevice("desktop")} className={compactButtonClass}>Desktop</button><button onClick={() => setPreviewDevice("mobile")} className={compactButtonClass}>Mobile</button></div></div>
          <div className={`border ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-white"} overflow-hidden`}><div className={`mx-auto p-6 ${previewDevice === "mobile" ? "max-w-[375px]" : "w-full"}`}><div className="text-sm" dangerouslySetInnerHTML={{ __html: currentHtml }} /></div></div>
        </div>
      ) : null}
    </div>
  )
}
