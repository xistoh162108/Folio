"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  deleteCampaign,
  deleteSubscriberAsAdmin,
  removeNewsletterAsset,
  reorderCampaign,
  rerunCampaign,
  retryDelivery,
  sendTestCampaign,
  startCampaign,
  toggleNewsletterAssetAttachment,
  unsubscribeSubscriberAsAdmin,
  upsertCampaign,
} from "@/lib/actions/newsletter.actions"
import { buildNewsletterEmail } from "@/lib/email/templates/newsletter"
import { buildNewsletterComposePayload } from "@/lib/newsletter/compose"
import type {
  NewsletterCampaignEditorDTO,
  NewsletterDashboardData,
  NewsletterRecipientMode,
} from "@/lib/contracts/newsletter"
import { getNewsletterTopicDefinitions, getNewsletterTopicName, normalizeNewsletterTopics, type NewsletterVisibleTopic } from "@/lib/newsletter/topics"

type ViewMode = "compose" | "subscribers" | "preview"
type PreviewDevice = "desktop" | "mobile"

interface NewsletterManagerProps {
  dashboard: NewsletterDashboardData
  testEmail?: string
  isDarkMode?: boolean
  initialView?: ViewMode
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "--"
  }

  return new Date(value).toISOString().slice(0, 10)
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value}B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)}KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)}MB`
}

function generateProgressBar(current: number, total: number, width = 10) {
  const ratio = total > 0 ? current / total : 0
  const filled = Math.max(0, Math.min(width, Math.round(ratio * width)))
  const empty = width - filled
  return `[${"=".repeat(filled)}${"-".repeat(empty)}]`
}

function insertSelection(input: {
  textarea: HTMLTextAreaElement
  before: string
  after?: string
  fallback?: string
}) {
  const { textarea, before, after = "", fallback = "text" } = input
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.slice(start, end) || fallback
  const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
  const nextCursor = start + before.length + selected.length + after.length

  textarea.value = nextValue
  textarea.setSelectionRange(nextCursor, nextCursor)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  textarea.focus()
}

function mapCampaignToComposeState(campaign: NewsletterCampaignEditorDTO | null) {
  return {
    campaignId: campaign?.id ?? null,
    subject: campaign?.subject ?? "",
    markdown: campaign?.markdown ?? "",
    recipientMode: campaign?.recipientMode ?? "TOPICS",
    topics: campaign?.topics ?? (["all"] as NewsletterVisibleTopic[]),
    targetSubscriberIds: campaign?.targetSubscriberIds ?? [],
    skipPreviouslySent: campaign?.skipPreviouslySent ?? false,
    assets: campaign?.assets ?? [],
    status: campaign?.status ?? "DRAFT",
  }
}

export function V0NewsletterManager({
  dashboard,
  testEmail = "",
  isDarkMode = true,
  initialView = "compose",
}: NewsletterManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop")
  const [message, setMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [composeState, setComposeState] = useState(() => mapCampaignToComposeState(dashboard.selectedCampaign))

  useEffect(() => {
    setViewMode(initialView)
  }, [initialView])

  useEffect(() => {
    setComposeState(mapCampaignToComposeState(dashboard.selectedCampaign))
  }, [dashboard.selectedCampaign])

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"
  const accentColor = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const accentBorder = isDarkMode ? "border-[#D4FF00]" : "border-[#3F5200]"
  const destructiveText = "text-[#FF3333]"

  const topicRows = useMemo(() => getNewsletterTopicDefinitions(), [])
  const currentHtml = useMemo(
    () => {
      const rendered = buildNewsletterComposePayload(composeState.markdown, composeState.assets)
      return buildNewsletterEmail({
        subject: composeState.subject || "(No subject)",
        html: rendered.html,
        text: rendered.text,
      }).html
    },
    [composeState.assets, composeState.markdown, composeState.subject],
  )

  const activeSubscriberIds = useMemo(
    () => new Set(dashboard.subscriberOptions.map((subscriber) => subscriber.id)),
    [dashboard.subscriberOptions],
  )

  const targetCount = useMemo(() => {
    if (composeState.recipientMode === "SELECTED_SUBSCRIBERS") {
      return composeState.targetSubscriberIds.filter((subscriberId) => activeSubscriberIds.has(subscriberId)).length
    }

    const selectedTopics = normalizeNewsletterTopics(composeState.topics)
    if (selectedTopics.includes("all")) {
      return dashboard.subscriberOptions.length
    }

    return dashboard.subscriberOptions.filter(
      (subscriber) =>
        subscriber.topics.includes("all") || subscriber.topics.some((topic) => selectedTopics.includes(topic)),
    ).length
  }, [activeSubscriberIds, composeState.recipientMode, composeState.targetSubscriberIds, composeState.topics, dashboard.subscriberOptions])

  const subscriberTopicCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const topic of topicRows) {
      if (topic.normalizedName === "all") {
        counts.set(topic.normalizedName, dashboard.activeSubscriberCount)
        continue
      }

      counts.set(
        topic.normalizedName,
        dashboard.subscriberOptions.filter(
          (subscriber) =>
            subscriber.topics.includes("all") || subscriber.topics.includes(topic.normalizedName),
        ).length,
      )
    }
    return counts
  }, [dashboard.activeSubscriberCount, dashboard.subscriberOptions, topicRows])

  const currentEditableCampaignId =
    composeState.campaignId && composeState.status === "DRAFT" ? composeState.campaignId : undefined

  const buildHref = (updates: Record<string, string | number | null | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "")

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    }

    const query = params.toString()
    return query ? `/admin/newsletter?${query}` : "/admin/newsletter"
  }

  const runAction = (task: () => Promise<{ success: boolean; error?: string; message?: string; campaignId?: string }>) => {
    setMessage(null)

    startTransition(async () => {
      const result = await task()

      if (!result.success) {
        setMessage(result.error ?? "Operation failed.")
        return
      }

      setMessage(result.message ?? "Completed.")

      if (result.campaignId) {
        router.push(buildHref({ campaign: result.campaignId, view: "compose" }))
      } else {
        router.refresh()
      }
    })
  }

  const updateCompose = <K extends keyof typeof composeState>(key: K, value: (typeof composeState)[K]) => {
    setComposeState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const toggleTopic = (topic: NewsletterVisibleTopic) => {
    if (topic === "all") {
      updateCompose("topics", ["all"])
      return
    }

    updateCompose(
      "topics",
      normalizeNewsletterTopics(
        composeState.topics.includes("all")
          ? [topic]
          : composeState.topics.includes(topic)
            ? composeState.topics.filter((currentTopic) => currentTopic !== topic)
            : [...composeState.topics, topic],
      ),
    )
  }

  const toggleSubscriber = (subscriberId: string) => {
    updateCompose(
      "targetSubscriberIds",
      composeState.targetSubscriberIds.includes(subscriberId)
        ? composeState.targetSubscriberIds.filter((id) => id !== subscriberId)
        : [...composeState.targetSubscriberIds, subscriberId],
    )
  }

  const applyToolbar = (kind: "bold" | "italic" | "underline" | "h1" | "h2" | "link" | "list" | "code" | "math") => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    switch (kind) {
      case "bold":
        insertSelection({ textarea, before: "**", after: "**" })
        return
      case "italic":
        insertSelection({ textarea, before: "*", after: "*" })
        return
      case "underline":
        insertSelection({ textarea, before: "<u>", after: "</u>" })
        return
      case "h1":
        insertSelection({ textarea, before: "# ", fallback: "Heading" })
        return
      case "h2":
        insertSelection({ textarea, before: "## ", fallback: "Heading" })
        return
      case "link":
        insertSelection({ textarea, before: "[", after: "](https://)", fallback: "label" })
        return
      case "list":
        insertSelection({ textarea, before: "- ", fallback: "item" })
        return
      case "code":
        insertSelection({ textarea, before: "```txt\n", after: "\n```", fallback: "code" })
        return
      case "math":
        insertSelection({ textarea, before: "$", after: "$", fallback: "x^2" })
        return
    }
  }

  const uploadAsset = async (kind: "image" | "file", file: File) => {
    if (!currentEditableCampaignId) {
      setMessage("Save the draft first to unlock asset uploads.")
      return
    }

    const formData = new FormData()
    formData.set("kind", kind)
    formData.set("campaignId", currentEditableCampaignId)
    formData.set("file", file)

    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/admin/newsletter/uploads", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json()

      if (!response.ok) {
        setMessage(String(payload.error ?? "Upload failed."))
        return
      }

      setMessage(`${file.name} uploaded.`)
      router.refresh()
    })
  }

  const saveDraft = () =>
    runAction(() =>
      upsertCampaign({
        id: currentEditableCampaignId,
        subject: composeState.subject,
        markdown: composeState.markdown,
        topics: normalizeNewsletterTopics(composeState.topics),
        recipientMode: composeState.recipientMode,
        targetSubscriberIds: composeState.targetSubscriberIds,
        skipPreviouslySent: composeState.skipPreviouslySent,
      }),
    )

  return (
    <div className="space-y-6 font-mono">
      <div>
        <p className={`text-xs ${mutedText}`}>// newsletter campaign</p>
        <h2 className="text-lg mt-1">Dispatch Manager</h2>
      </div>

      {!dashboard.migrationReady ? (
        <div className={`border ${borderColor} p-4 text-xs`}>
          <p className={accentColor}>[MIGRATION REQUIRED]</p>
          <p className={`mt-2 ${mutedText}`}>Newsletter hardening tables and columns are not fully available yet.</p>
        </div>
      ) : null}

      {message ? <div className={`border ${borderColor} p-4 text-xs ${message.startsWith("[") ? "" : accentColor}`}>{message}</div> : null}

      <div className={`flex border-b ${borderColor}`}>
        {(["compose", "subscribers", "preview"] as ViewMode[]).map((mode) => (
          <Link
            key={mode}
            href={buildHref({ view: mode })}
            onClick={() => setViewMode(mode)}
            className={`v0-control-tab ${
              viewMode === mode ? `${activeBg} border-b-2 ${isDarkMode ? "border-white" : "border-black"}` : hoverBg
            }`}
          >
            {mode === "compose" && "[+] Compose"}
            {mode === "subscribers" && "Subscribers"}
            {mode === "preview" && "Preview"}
          </Link>
        ))}
      </div>

      {viewMode === "compose" ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedText}`}>// recipients</p>
              <div className="flex gap-1">
                {(["TOPICS", "SELECTED_SUBSCRIBERS"] as NewsletterRecipientMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateCompose("recipientMode", mode)}
                    className={`v0-control-button-compact transition-colors ${
                      composeState.recipientMode === mode ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                    }`}
                  >
                    {mode === "TOPICS" ? "topics" : "selected"}
                  </button>
                ))}
              </div>
            </div>

            {composeState.recipientMode === "TOPICS" ? (
              <div className="flex flex-wrap gap-2">
                {topicRows.map((topic) => (
                  <button
                    key={topic.normalizedName}
                    type="button"
                    onClick={() => toggleTopic(topic.normalizedName)}
                    className={`v0-control-inline-button ${
                      composeState.topics.includes(topic.normalizedName) ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                    }`}
                  >
                    [{topic.name}]
                  </button>
                ))}
              </div>
            ) : (
              <div className={`border ${borderColor} max-h-48 overflow-y-auto`}>
                {dashboard.subscriberOptions.map((subscriber) => (
                  <button
                    key={subscriber.id}
                    type="button"
                    onClick={() => toggleSubscriber(subscriber.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-xs last:border-b-0 ${borderColor} ${hoverBg}`}
                  >
                    <span>{subscriber.email}</span>
                    <span className={composeState.targetSubscriberIds.includes(subscriber.id) ? accentColor : mutedText}>
                      {composeState.targetSubscriberIds.includes(subscriber.id) ? "[selected]" : "[ ]"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className={`text-xs ${accentColor}`}>Target: {targetCount} users</p>
          </section>

          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// subject</p>
            <input
              type="text"
              value={composeState.subject}
              onChange={(event) => updateCompose("subject", event.target.value)}
              placeholder="Subject: Your newsletter title..."
              className={`v0-control-field ${borderColor}`}
            />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedText}`}>// markdown body</p>
              <label className={`flex items-center gap-2 text-xs ${mutedText}`}>
                <input
                  type="checkbox"
                  checked={composeState.skipPreviouslySent}
                  onChange={(event) => updateCompose("skipPreviouslySent", event.target.checked)}
                />
                send unsent only
              </label>
            </div>
            <div className={`flex flex-wrap items-center gap-1 border ${borderColor} p-2`}>
              {[
                ["B", "bold"],
                ["I", "italic"],
                ["U", "underline"],
                ["H1", "h1"],
                ["H2", "h2"],
                ["link", "link"],
                ["list", "list"],
                ["code", "code"],
                ["math", "math"],
              ].map(([label, kind]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => applyToolbar(kind as Parameters<typeof applyToolbar>[0])}
                  className={`v0-control-button-compact ${hoverBg}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={composeState.markdown}
              onChange={(event) => updateCompose("markdown", event.target.value)}
              placeholder="Write the dispatch in Markdown..."
              className={`v0-control-area h-56 ${borderColor}`}
            />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedText}`}>// assets</p>
              {currentEditableCampaignId ? (
                <div className="flex gap-2">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}>
                    [upload image]
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}>
                    [upload file]
                  </button>
                </div>
              ) : (
                <span className={`text-xs ${mutedText}`}>save the draft first to unlock uploads</span>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept={["image/jpeg", "image/png", "image/webp"].join(",")}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void uploadAsset("image", file)
                }
                event.currentTarget.value = ""
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={["application/pdf", "text/plain"].join(",")}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void uploadAsset("file", file)
                }
                event.currentTarget.value = ""
              }}
            />

            <div className="space-y-1">
              {composeState.assets.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-4 text-xs ${mutedText}`}>No assets attached to this draft.</div>
              ) : null}
              {composeState.assets.map((asset) => (
                <div key={asset.id} className={`flex flex-wrap items-center justify-between gap-3 border ${borderColor} px-3 py-3 text-xs ${hoverBg}`}>
                  <div className="space-y-1">
                    <p>{asset.originalName}</p>
                    <p className={mutedText}>
                      [{asset.kind.toLowerCase()}] {formatBytes(asset.size)} / {formatDate(asset.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {asset.kind === "IMAGE" && asset.publicUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateCompose(
                            "markdown",
                            `${composeState.markdown}${composeState.markdown.trim().length > 0 ? "\n\n" : ""}![${asset.originalName}](${asset.publicUrl})`,
                          )
                        }
                        className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                      >
                        [insert]
                      </button>
                    ) : null}
                    {asset.kind === "FILE" ? (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(() =>
                            toggleNewsletterAssetAttachment({
                              assetId: asset.id,
                              sendAsAttachment: !asset.sendAsAttachment,
                            }),
                          )
                        }
                        className={`v0-control-button-compact border ${asset.sendAsAttachment ? accentBorder : borderColor} ${
                          asset.sendAsAttachment ? accentColor : mutedText
                        }`}
                      >
                        {asset.sendAsAttachment ? "[attached]" : "[attach]"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => runAction(() => removeNewsletterAsset({ assetId: asset.id }))}
                      className={`v0-control-button-compact border ${borderColor} ${destructiveText}`}
                    >
                      [remove]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  runAction(() =>
                    sendTestCampaign({
                      email: testEmail,
                      subject: composeState.subject,
                      markdown: composeState.markdown,
                      assetIds: composeState.assets.filter((asset) => asset.sendAsAttachment).map((asset) => asset.id),
                    }),
                  )
                }
                disabled={isPending || !composeState.subject || !composeState.markdown || !testEmail}
                className={`v0-control-button border ${borderColor} ${hoverBg} disabled:opacity-50`}
              >
                [ send test ]
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={isPending || !composeState.subject || !composeState.markdown || !dashboard.migrationReady}
                className={`v0-control-button border ${borderColor} ${hoverBg} disabled:opacity-50`}
              >
                [ save queue draft ]
              </button>
              {currentEditableCampaignId ? (
                <button
                  type="button"
                  onClick={() => runAction(() => startCampaign({ campaignId: currentEditableCampaignId }))}
                  disabled={isPending || !dashboard.migrationReady}
                  className={`v0-control-button ${
                    isPending || !dashboard.migrationReady
                      ? `border ${borderColor} ${mutedText} cursor-not-allowed`
                      : `${isDarkMode ? "bg-[#D4FF00] text-black" : "bg-[#3F5200] text-white"}`
                  }`}
                >
                  {isPending ? "Sending..." : `[ launch campaign (${targetCount}) ]`}
                </button>
              ) : null}
            </div>
            <p className={`text-xs ${mutedText}`}>Test target: {testEmail || "missing session email"}</p>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedText}`}>// queue</p>
              <p className={`text-xs ${mutedText}`}>
                {dashboard.campaignsPagination.page}/{dashboard.campaignsPagination.totalPages}
              </p>
            </div>
            <div className="space-y-1">
              {dashboard.campaigns.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-4 text-xs ${mutedText}`}>No campaigns yet.</div>
              ) : null}
              {dashboard.campaigns.map((campaign) => (
                <div key={campaign.id} className={`border ${borderColor} px-3 py-3 space-y-2 ${hoverBg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span>{campaign.subject}</span>
                    <span className={campaign.status === "COMPLETED" ? accentColor : mutedText}>[{campaign.status.toLowerCase()}]</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={mutedText}>[{campaign.recipientMode === "TOPICS" ? "topics" : "selected"}]</span>
                    {campaign.topics.map((topic) => (
                      <span key={topic} className={mutedText}>
                        [{getNewsletterTopicName(topic) ?? topic}]
                      </span>
                    ))}
                    {campaign.skipPreviouslySent ? <span className={accentColor}>[unsent only]</span> : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className={mutedText}>
                      {generateProgressBar(campaign.sentCount + campaign.failedCount, campaign.deliveryCount)} {campaign.sentCount}/
                      {campaign.deliveryCount} sent
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={mutedText}>{formatDate(campaign.createdAt)}</span>
                      <Link href={buildHref({ campaign: campaign.id, view: "compose" })} className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}>
                        [edit]
                      </Link>
                      {campaign.status === "DRAFT" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => runAction(() => reorderCampaign({ campaignId: campaign.id, direction: "up" }))}
                            className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                          >
                            [^]
                          </button>
                          <button
                            type="button"
                            onClick={() => runAction(() => reorderCampaign({ campaignId: campaign.id, direction: "down" }))}
                            className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                          >
                            [v]
                          </button>
                          <button
                            type="button"
                            onClick={() => runAction(() => startCampaign({ campaignId: campaign.id }))}
                            className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                          >
                            [start]
                          </button>
                        </>
                      ) : null}
                      {campaign.status !== "DRAFT" && campaign.status !== "SENDING" ? (
                        <button
                          type="button"
                          onClick={() => runAction(() => rerunCampaign({ campaignId: campaign.id }))}
                          className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                        >
                          [rerun]
                        </button>
                      ) : null}
                      {campaign.status !== "SENDING" ? (
                        <button
                          type="button"
                          onClick={() => runAction(() => deleteCampaign({ campaignId: campaign.id }))}
                          className={`v0-control-button-compact border ${borderColor} ${destructiveText}`}
                        >
                          [drop]
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`flex items-center justify-between text-xs ${mutedText}`}>
              <Link
                href={buildHref({ campaignsPage: dashboard.campaignsPagination.page - 1, view: "compose" })}
                className={dashboard.campaignsPagination.hasPrevious ? hoverBg : "pointer-events-none opacity-30"}
              >
                [prev]
              </Link>
              <span>
                {dashboard.campaignsPagination.page} / {dashboard.campaignsPagination.totalPages}
              </span>
              <Link
                href={buildHref({ campaignsPage: dashboard.campaignsPagination.page + 1, view: "compose" })}
                className={dashboard.campaignsPagination.hasNext ? hoverBg : "pointer-events-none opacity-30"}
              >
                [next]
              </Link>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs ${mutedText}`}>// deliveries</p>
              <p className={`text-xs ${mutedText}`}>
                {dashboard.deliveriesPagination.page}/{dashboard.deliveriesPagination.totalPages}
              </p>
            </div>
            <div className="space-y-1">
              {dashboard.deliveries.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-4 text-xs ${mutedText}`}>No deliveries yet.</div>
              ) : null}
              {dashboard.deliveries.map((delivery) => (
                <div key={delivery.id} className={`border ${borderColor} px-3 py-3 space-y-2 ${hoverBg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span>{delivery.email}</span>
                    <span className={delivery.status === "SENT" ? accentColor : delivery.status === "FAILED" ? destructiveText : mutedText}>
                      [{delivery.status.toLowerCase()}]
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className={mutedText}>{delivery.campaignId}</span>
                    <div className="flex items-center gap-2">
                      <span className={mutedText}>{formatDate(delivery.sentAt ?? delivery.createdAt)}</span>
                      {delivery.status === "FAILED" ? (
                        <button
                          type="button"
                          onClick={() => runAction(() => retryDelivery(delivery.id))}
                          className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                        >
                          [retry]
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {delivery.errorMessage ? <p className={`text-xs ${destructiveText}`}>{delivery.errorMessage}</p> : null}
                </div>
              ))}
            </div>
            <div className={`flex items-center justify-between text-xs ${mutedText}`}>
              <Link
                href={buildHref({ deliveriesPage: dashboard.deliveriesPagination.page - 1, view: "compose" })}
                className={dashboard.deliveriesPagination.hasPrevious ? hoverBg : "pointer-events-none opacity-30"}
              >
                [prev]
              </Link>
              <span>
                {dashboard.deliveriesPagination.page} / {dashboard.deliveriesPagination.totalPages}
              </span>
              <Link
                href={buildHref({ deliveriesPage: dashboard.deliveriesPagination.page + 1, view: "compose" })}
                className={dashboard.deliveriesPagination.hasNext ? hoverBg : "pointer-events-none opacity-30"}
              >
                [next]
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {viewMode === "subscribers" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>All</p>
              <p className="text-xl mt-1">{dashboard.activeSubscriberCount}</p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>Project &amp; Info</p>
              <p className="text-xl mt-1">{subscriberTopicCounts.get("project-info") ?? 0}</p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>Log</p>
              <p className="text-xl mt-1">{subscriberTopicCounts.get("log") ?? 0}</p>
            </div>
          </div>

          <div className={`border ${borderColor} overflow-hidden`}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Email</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Topics</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Status</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Date</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className={`border-b ${borderColor} ${hoverBg} transition-colors last:border-b-0`}>
                    <td className="p-3 text-xs">{subscriber.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {subscriber.topicLabels.map((topic) => (
                          <span key={topic} className={`text-xs ${mutedText}`}>
                            [{topic}]
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`p-3 text-xs ${subscriber.status === "ACTIVE" ? accentColor : mutedText}`}>[{subscriber.status.toLowerCase()}]</td>
                    <td className={`p-3 text-xs ${mutedText}`}>{formatDate(subscriber.subscribedAt)}</td>
                    <td className="p-3 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {subscriber.status !== "UNSUBSCRIBED" ? (
                          <button
                            type="button"
                            onClick={() => runAction(() => unsubscribeSubscriberAsAdmin({ subscriberId: subscriber.id }))}
                            className={`v0-control-button-compact border ${borderColor} ${hoverBg}`}
                          >
                            [unsubscribe]
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => runAction(() => deleteSubscriberAsAdmin({ subscriberId: subscriber.id }))}
                          className={`v0-control-button-compact border ${borderColor} ${destructiveText}`}
                        >
                          [delete]
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`flex items-center justify-between text-xs ${mutedText}`}>
            <Link
              href={buildHref({ subscribersPage: dashboard.subscribersPagination.page - 1, view: "subscribers" })}
              className={dashboard.subscribersPagination.hasPrevious ? hoverBg : "pointer-events-none opacity-30"}
            >
              [prev]
            </Link>
            <span>
              {dashboard.subscribersPagination.page} / {dashboard.subscribersPagination.totalPages}
            </span>
            <Link
              href={buildHref({ subscribersPage: dashboard.subscribersPagination.page + 1, view: "subscribers" })}
              className={dashboard.subscribersPagination.hasNext ? hoverBg : "pointer-events-none opacity-30"}
            >
              [next]
            </Link>
          </div>
        </div>
      ) : null}

      {viewMode === "preview" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={`text-xs ${mutedText}`}>// preview</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`v0-control-button-compact transition-colors ${
                  previewDevice === "desktop" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
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
              <span className="text-xs">{composeState.subject || "(No subject)"}</span>
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
