"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { V0MarkdownEditor, type V0MarkdownEditorHandle } from "@/components/admin/v0-markdown-editor"
import type { PostEditorInput } from "@/lib/contracts/posts"
import { archivePost, savePost } from "@/lib/actions/post.actions"
import { buildMarkdownWriterPayload, deriveMarkdownSource } from "@/lib/content/markdown-blocks"
import { TiptapEditor } from "@/components/admin/tiptap-editor"

function escapeMarkdownText(value: string) {
  return value.replace(/([\\[\]()"'])/g, "\\$1")
}

function buildAssetSnippet(input: {
  assetId: string
  kind: "image" | "file"
  originalName: string
}) {
  const label = escapeMarkdownText(input.originalName.replace(/\.[^/.]+$/, "") || input.originalName)

  if (input.kind === "image") {
    return `\n![${label}](asset://${input.assetId} "${label}")\n`
  }

  return `\n[${label}](asset://${input.assetId})\n`
}

function stripAssetReferences(markdownSource: string, assetId: string) {
  const escapedAssetId = assetId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(`!\\[[^\\]]*\\]\\(asset://${escapedAssetId}(?:\\s+"[^"]*")?\\)`, "g"),
    new RegExp(`\\[[^\\]]+\\]\\(asset://${escapedAssetId}\\)`, "g"),
  ]

  const nextSource = patterns.reduce((current, pattern) => current.replace(pattern, ""), markdownSource)
  return nextSource
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
}

export function PostEditor({
  initialPost,
  variant = "default",
  showHeader = true,
  isDarkMode = true,
}: {
  initialPost: PostEditorInput
  variant?: "default" | "v0"
  showHeader?: boolean
  isDarkMode?: boolean
}) {
  const router = useRouter()
  const isV0 = variant === "v0"
  const initialMarkdownSource = useMemo(
    () =>
      deriveMarkdownSource({
        markdownSource: initialPost.markdownSource,
        content: initialPost.content,
        htmlContent: initialPost.htmlContent,
        excerpt: initialPost.excerpt,
        title: initialPost.title,
      }),
    [initialPost],
  )
  const [isPending, startTransition] = useTransition()
  const [pendingCommand, setPendingCommand] = useState<"draft" | "publish" | "archive" | "save" | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [tagsText, setTagsText] = useState(initialPost.tags.join(", "))
  const [form, setForm] = useState<PostEditorInput>(() => {
    if (!isV0) {
      return initialPost
    }

    const payload = buildMarkdownWriterPayload(initialMarkdownSource, initialPost.assets)
    return {
      ...initialPost,
      contentMode: "block",
      markdownSource: payload.markdownSource,
      content: payload.content,
      htmlContent: payload.htmlContent,
      contentVersion: payload.contentVersion,
    }
  })
  const markdownEditorRef = useRef<V0MarkdownEditorHandle>(null)

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  )

  const onSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pendingCommand) return

    setMessage(null)
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const command = submitter?.value === "publish" ? "publish" : submitter?.value === "draft" ? "draft" : "save"
    const nextStatus = command === "publish" ? "PUBLISHED" : command === "draft" ? "DRAFT" : form.status

    setPendingCommand(command)
    startTransition(async () => {
      try {
        const result = await savePost({
          ...form,
          status: nextStatus,
          tags: parsedTags,
        })

        if (!result.success) {
          setMessage(result.error)
          return
        }

        setMessage("Saved.")
        router.replace(`/admin/posts/${result.id}`)
        router.refresh()
      } finally {
        setPendingCommand(null)
      }
    })
  }

  const onArchive = () => {
    if (!form.id || pendingCommand) return

    setPendingCommand("archive")
    startTransition(async () => {
      try {
        const result = await archivePost(form.id!)

        if (!result.success) {
          setMessage(result.error)
          return
        }

        setMessage("Archived.")
        router.refresh()
      } finally {
        setPendingCommand(null)
      }
    })
  }

  const uploadAsset = async (kind: "image" | "file", file: File) => {
    if (!form.id) {
      setMessage("Create a draft before uploading assets.")
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const payload = new FormData()
      payload.set("kind", kind)
      payload.set("postId", form.id)
      payload.set("file", file)

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: payload,
      })

      const result = (await response.json()) as
        | { error: string }
        | {
            assetId: string
            kind: "image" | "file"
            originalName: string
            mime: string
            size: number
            url?: string
          }

      if (!response.ok || "error" in result) {
        setMessage("error" in result ? result.error : "Upload failed.")
        return
      }

      setForm((current) => {
        const nextAssets: PostEditorInput["assets"] = [
          ...current.assets.filter((asset) => asset.id !== result.assetId),
          {
            id: result.assetId,
            kind: kind === "image" ? "IMAGE" : "FILE",
            originalName: result.originalName,
            mime: result.mime,
            size: result.size,
            url: result.url ?? `/api/files/${result.assetId}`,
            createdAt: new Date().toISOString(),
          },
        ]

        return {
          ...current,
          assets: nextAssets,
        }
      })
      const snippet = buildAssetSnippet({
        assetId: result.assetId,
        kind,
        originalName: result.originalName,
      })
      requestAnimationFrame(() => {
        insertMarkdownSnippet(snippet)
      })
      setMessage(kind === "image" ? "Image uploaded and inserted into the body." : "File uploaded.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const uploadAssets = async (kind: "image" | "file", files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    for (const file of Array.from(files)) {
      await uploadAsset(kind, file)
    }
  }

  const imageAssets = form.assets.filter((asset) => asset.kind === "IMAGE")
  const fileAssets = form.assets.filter((asset) => asset.kind === "FILE")

  const removeAsset = (assetId: string) => {
    setForm((current) => {
      const asset = current.assets.find((item) => item.id === assetId)
      const nextAssets = current.assets.filter((item) => item.id !== assetId)
      const shouldClearCover =
        Boolean(asset?.url) && asset?.kind === "IMAGE" && current.coverImageUrl === asset.url
      const nextMarkdownSource = stripAssetReferences(current.markdownSource ?? "", assetId)
      const payload = buildMarkdownWriterPayload(nextMarkdownSource, nextAssets)

      return {
        ...current,
        contentMode: "block",
        coverImageUrl: shouldClearCover ? "" : current.coverImageUrl,
        markdownSource: payload.markdownSource,
        content: payload.content,
        htmlContent: payload.htmlContent,
        contentVersion: payload.contentVersion,
        assets: nextAssets,
      }
    })
  }

  const addLink = () => {
    setForm((current) => ({
      ...current,
      links: [...current.links, { label: "", url: "", type: "WEBSITE" }],
    }))
  }

  const updateLink = (index: number, patch: Partial<PostEditorInput["links"][number]>) => {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) => (linkIndex === index ? { ...link, ...patch } : link)),
    }))
  }

  const removeLink = (index: number) => {
    setForm((current) => ({
      ...current,
      links: current.links.filter((_, linkIndex) => linkIndex !== index),
    }))
  }

  const syncMarkdownSource = (nextMarkdownSource: string) => {
    const payload = buildMarkdownWriterPayload(nextMarkdownSource, form.assets)
    setForm((current) => ({
      ...current,
      contentMode: "block",
      markdownSource: payload.markdownSource,
      content: payload.content,
      htmlContent: payload.htmlContent,
      contentVersion: payload.contentVersion,
    }))
  }

  const insertMarkdownSnippet = (snippet: string, options?: { selectOffset?: number }) => {
    markdownEditorRef.current?.insertSnippet(snippet, options)
  }

  if (isV0) {
    const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
    const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
    const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
    const fieldClass = `v0-control-field ${borderColor} ${isDarkMode ? "text-white focus:border-white/40" : "text-black focus:border-black/40"}`
    const compactFieldClass = `v0-control-field-compact ${borderColor} ${isDarkMode ? "text-white focus:border-white/40" : "text-black focus:border-black/40"}`
    const buttonClass = `v0-control-button ${borderColor} ${hoverBg}`
    const compactButtonClass = `v0-control-button-compact ${borderColor} ${hoverBg}`
    const supportBlockClass = `border ${borderColor} px-4 py-4`
    const projectLinks = form.links
    const supportLinks = form.type === "PROJECT" ? [] : form.links

    return (
      <form onSubmit={onSave} className="space-y-6">
        {showHeader ? (
          <div>
            <p className={mutedText}>Editor</p>
            <h1 className={isDarkMode ? "mt-1 text-lg text-white" : "mt-1 text-lg text-black"}>{form.id ? "Edit post" : "New post"}</h1>
          </div>
        ) : null}

        {message ? <p className={`border ${borderColor} px-4 py-3 text-sm ${isDarkMode ? "text-white/80" : "text-black/80"}`}>[{message}]</p> : null}

        <div>
          <label className={`text-xs ${mutedText} block mb-2`}>Title</label>
          <input
            aria-label="Title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Enter post title..."
            className={fieldClass}
          />
        </div>

        <div className={`flex items-center gap-3 py-3 px-4 border ${borderColor}`}>
          <button
            type="button"
            aria-label="Mark as Project"
            onClick={() =>
              setForm((current) => ({
                ...current,
                type: current.type === "PROJECT" ? "NOTE" : "PROJECT",
              }))
            }
            className={`w-10 h-5 border ${borderColor} flex items-center transition-colors ${
              form.type === "PROJECT" ? "bg-white/20" : ""
            }`}
          >
            <span className={`w-4 h-4 bg-white transition-transform ${form.type === "PROJECT" ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className={isDarkMode ? "text-sm text-white" : "text-sm text-black"}>Mark as Project</span>
          <span className={`text-xs ${mutedText}`}>
            {form.type === "PROJECT" ? "(Will show in Projects section)" : "(Regular note/post)"}
          </span>
        </div>

        {form.type === "PROJECT" ? (
          <div className={`space-y-4 p-4 border ${borderColor} ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
            <p className={`text-xs ${mutedText}`}>// project details</p>

            <div className="space-y-2">
              <label className={`text-xs ${mutedText}`}>Project URLs</label>
              {projectLinks.length === 0 ? <p className={`text-sm ${mutedText}`}>No project URLs yet.</p> : null}
              {projectLinks.map((link, index) => (
                <div key={`${link.id ?? "new"}-${index}`} className="flex flex-wrap gap-2">
                  <select
                    value={link.type ?? "WEBSITE"}
                    onChange={(event) => updateLink(index, { type: event.target.value as PostEditorInput["links"][number]["type"] })}
                    className={`${compactFieldClass} min-w-[7rem]`}
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="GITHUB">GitHub</option>
                    <option value="DOCS">Docs</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    value={link.url}
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                    placeholder="https://github.com/..."
                    className={`${fieldClass} min-w-[16rem] flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet(`\n${link.url.trim()}\n`)}
                    className={buttonClass}
                    disabled={link.url.trim().length === 0}
                  >
                    [insert]
                  </button>
                  <button type="button" onClick={() => removeLink(index)} className={buttonClass}>
                    x
                  </button>
                </div>
              ))}
              <button type="button" onClick={addLink} className={`v0-control-button-compact ${mutedText} ${hoverBg}`}>
                [+] Add another URL
              </button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs ${mutedText}`}>Preview Card</label>
              <div className={`border-2 border-dashed ${borderColor} p-6 text-center space-y-2`}>
                {form.coverImageUrl ? (
                  <div className="space-y-3">
                    <img src={form.coverImageUrl} alt={form.title || "Cover image"} className={`h-40 w-full border ${borderColor} object-cover`} />
                    <p className={`text-xs ${mutedText} break-all`}>{form.coverImageUrl}</p>
                  </div>
                ) : (
                  <>
                    <p className={`text-sm ${mutedText}`}>Drop preview image here</p>
                    <p className={`text-xs ${mutedText} mt-1`}>or click to upload</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className={`border-2 border-dashed ${borderColor} p-6 text-center space-y-3`}>
          <div className="space-y-1">
            <p className={`text-sm ${mutedText}`}>{isUploading ? "[ uploading_ ]" : "Drag & Drop Image Upload"}</p>
            <p className={`text-xs ${mutedText}`}>or click to browse files</p>
            <p className={`text-xs ${mutedText}`}>uploaded assets insert `asset://` tokens at the cursor</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <label className={`${buttonClass} cursor-pointer`}>
              [image]
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={isUploading}
                onChange={(event) => {
                  void uploadAssets("image", event.target.files)
                  event.currentTarget.value = ""
                }}
                className="sr-only"
              />
            </label>
            <label className={`${buttonClass} cursor-pointer`}>
              [file]
              <input
                type="file"
                accept=".pdf,.txt,text/plain,application/pdf"
                multiple
                disabled={isUploading}
                onChange={(event) => {
                  void uploadAssets("file", event.target.files)
                  event.currentTarget.value = ""
                }}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className={`text-xs ${mutedText}`}>// body :: markdown-first</p>
            <span className={`text-xs ${mutedText}`}>inline math: `$...$` :: block math: `$$`</span>
          </div>
          <V0MarkdownEditor
            ref={markdownEditorRef}
            value={form.markdownSource ?? ""}
            onChange={syncMarkdownSource}
            isDarkMode={isDarkMode}
            placeholder={"# Title\n\nWrite in markdown...\n\n- bullet\n> quote\n$$\nexpression\n$$"}
          />
          <p className={`text-xs ${mutedText}`}>canonical blocks + derived html update as you type. no separate preview mode.</p>
        </section>

        <div>
          <label className={`text-xs ${mutedText} block mb-2`}>Tags</label>
          <input
            value={tagsText}
            onChange={(event) => setTagsText(event.target.value)}
            placeholder="#AI, #InfoSec, #Project..."
            className={fieldClass}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {form.id ? (
            <button type="button" onClick={onArchive} disabled={isPending && pendingCommand === "archive"} className={`${buttonClass} disabled:opacity-50`}>
              Archive
            </button>
          ) : null}
          <button type="submit" value="draft" disabled={(isPending && pendingCommand === "draft") || isUploading} className={`${buttonClass} disabled:opacity-50`}>
            {isPending && pendingCommand === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="submit"
            value="publish"
            disabled={(isPending && pendingCommand === "publish") || isUploading}
            className="v0-control-button bg-white px-4 text-black disabled:opacity-50"
          >
            {isPending && pendingCommand === "publish" ? "Publishing..." : "Publish"}
          </button>
          <span className={`text-xs ${mutedText}`}>[{form.type.toLowerCase()} :: {form.status.toLowerCase()}]</span>
        </div>

        {supportLinks.length > 0 || form.type !== "PROJECT" ? (
          <details className={supportBlockClass}>
            <summary className={`cursor-pointer text-xs ${mutedText}`}>[links]</summary>
            <div className="space-y-3 pt-4">
              {supportLinks.length === 0 ? <p className={`text-sm ${mutedText}`}>No structured links yet.</p> : null}
              {supportLinks.map((link, index) => (
                <div key={`${link.url}-${index}`} className={`grid gap-3 border ${borderColor} p-3 md:grid-cols-[130px_1fr_1fr_auto]`}>
                  <select
                    value={link.type ?? "WEBSITE"}
                    onChange={(event) => updateLink(index, { type: event.target.value as PostEditorInput["links"][number]["type"] })}
                    className={compactFieldClass}
                  >
                    <option value="WEBSITE">Website</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="GITHUB">GitHub</option>
                    <option value="DOCS">Docs</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    value={link.label}
                    onChange={(event) => updateLink(index, { label: event.target.value })}
                    placeholder="Label"
                    className={compactFieldClass}
                  />
                  <input
                    value={link.url}
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                    placeholder="https://..."
                    className={compactFieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => insertMarkdownSnippet(`\n${link.url.trim()}\n`)}
                    className={compactButtonClass}
                    disabled={link.url.trim().length === 0}
                  >
                    [insert]
                  </button>
                  <button type="button" onClick={() => removeLink(index)} className={compactButtonClass}>
                    [x]
                  </button>
                </div>
              ))}
              <button type="button" onClick={addLink} className={buttonClass}>
                [+] Add link
              </button>
            </div>
          </details>
        ) : null}

        <details className={supportBlockClass}>
          <summary className={`cursor-pointer text-xs ${mutedText}`}>[attachments]</summary>
          <div className="space-y-4 pt-4">
            {form.coverImageUrl ? (
              <div className="space-y-3">
                <img src={form.coverImageUrl} alt={form.title || "Cover image"} className={`h-48 w-full border ${borderColor} object-cover`} />
                <p className={`text-xs ${mutedText} break-all`}>{form.coverImageUrl}</p>
              </div>
            ) : null}
            {imageAssets.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {imageAssets.map((asset) => (
                  <li key={asset.id} className={`flex items-center justify-between gap-3 border ${borderColor} px-3 py-2`}>
                    <div className="space-y-1">
                      <p>{asset.originalName}</p>
                      {asset.pendingDeleteAt ? <p className="text-xs text-amber-300">Queued for deletion</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet(buildAssetSnippet({ assetId: asset.id, kind: "image", originalName: asset.originalName }))}
                        className={compactButtonClass}
                      >
                        [insert]
                      </button>
                      <button type="button" onClick={() => removeAsset(asset.id)} className={compactButtonClass}>
                        [remove]
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {fileAssets.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {fileAssets.map((asset) => (
                  <li key={asset.id} className={`flex items-center justify-between gap-3 border ${borderColor} px-3 py-2`}>
                    <div className="space-y-1">
                      <p>{asset.originalName}</p>
                      {asset.pendingDeleteAt ? <p className="text-xs text-amber-300">Queued for deletion</p> : null}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => insertMarkdownSnippet(buildAssetSnippet({ assetId: asset.id, kind: "file", originalName: asset.originalName }))}
                        className={compactButtonClass}
                      >
                        [insert]
                      </button>
                      <a href={asset.url} target="_blank" rel="noreferrer" className={compactButtonClass}>
                        [open]
                      </a>
                      <button type="button" onClick={() => removeAsset(asset.id)} className={compactButtonClass}>
                        [remove]
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      </form>
    )
  }

  const formClass = isV0 ? "space-y-6" : "space-y-6 rounded-3xl border border-white/10 bg-zinc-950/80 p-6"
  const panelClass = isV0 ? "space-y-4 border border-white/20 p-4" : "space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5"
  const fieldClass = isV0
    ? "w-full border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white/40"
    : "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
  const textareaClass = isV0
    ? "w-full border border-white/20 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white/40"
    : "w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
  const buttonClass = isV0
    ? "border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/5 disabled:opacity-50"
    : "rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:opacity-50"
  const secondaryButtonClass = isV0
    ? "border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/5 disabled:opacity-50"
    : "rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:opacity-50"

  return (
    <form onSubmit={onSave} className={formClass}>
      {showHeader ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.2em] text-zinc-500"}>Editor</p>
            <h1 className={isV0 ? "mt-1 text-lg text-white" : "mt-2 text-2xl font-semibold text-white"}>
              {form.id ? "Edit post" : "New post"}
            </h1>
          </div>
          <div className="flex gap-3">
            {form.id ? (
              <button type="button" onClick={onArchive} disabled={isPending && pendingCommand === "archive"} className={secondaryButtonClass}>
                Archive
              </button>
            ) : null}
            <button type="submit" disabled={(isPending && pendingCommand === "save") || isUploading} className={buttonClass}>
              {isPending && pendingCommand === "save" ? "Saving..." : isV0 ? "Save Draft" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {form.id ? (
            <button type="button" onClick={onArchive} disabled={isPending && pendingCommand === "archive"} className={secondaryButtonClass}>
              Archive
            </button>
          ) : null}
          <button type="submit" disabled={(isPending && pendingCommand === "save") || isUploading} className={buttonClass}>
            {isPending && pendingCommand === "save" ? "Saving..." : isV0 ? "Save Draft" : "Save"}
          </button>
        </div>
      )}

      {message ? (
        <p className={isV0 ? "border border-white/20 px-4 py-3 text-sm text-white/80" : "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-300"}>
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className={fieldClass}
          />
        </label>
        <label className="space-y-2">
          <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Slug</span>
          <input
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Type</span>
          <select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PostEditorInput["type"] }))}
            className={fieldClass}
          >
            <option value="NOTE">Note</option>
            <option value="PROJECT">Project</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PostEditorInput["status"] }))}
            className={fieldClass}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Cover image URL</span>
          <input
            value={form.coverImageUrl ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Excerpt</span>
        <textarea
          value={form.excerpt ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
          rows={3}
          className={textareaClass}
        />
      </label>

      <label className="block space-y-2">
        <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Tags</span>
        <input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="ai, infosec, project"
          className={fieldClass}
        />
      </label>

      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Link cards and embeds</p>
            <p className={isV0 ? "text-sm text-white/60" : "text-sm text-zinc-400"}>Add YouTube or website URLs. Preview metadata is fetched on save.</p>
          </div>
          <button
            type="button"
            onClick={addLink}
            className={buttonClass}
          >
            Add link
          </button>
        </div>

        {form.links.length > 0 ? (
          <div className="space-y-3">
            {form.links.map((link, index) => (
              <div key={`${link.url}-${index}`} className={`grid gap-3 border ${isV0 ? "border-white/20" : "border-white/10 rounded-2xl"} p-4 md:grid-cols-[140px_1fr_1fr_auto]`}>
                <select
                  value={link.type ?? "WEBSITE"}
                  onChange={(event) => updateLink(index, { type: event.target.value as PostEditorInput["links"][number]["type"] })}
                  className={fieldClass}
                >
                  <option value="WEBSITE">Website</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="GITHUB">GitHub</option>
                  <option value="DOCS">Docs</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  value={link.label}
                  onChange={(event) => updateLink(index, { label: event.target.value })}
                  placeholder="Label"
                  className={fieldClass}
                />
                <input
                  value={link.url}
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                  placeholder="https://..."
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className={secondaryButtonClass}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={isV0 ? "text-sm text-white/50" : "text-sm text-zinc-500"}>No structured links yet.</p>
        )}
      </div>

      <label className="block space-y-2">
        <span className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Body</span>
        <TiptapEditor
          initialContent={form.content}
          fallbackHtml={form.htmlContent}
          variant={variant}
          onChange={({ content, html }) =>
            setForm((current) => ({
              ...current,
              content,
              htmlContent: html,
            }))
          }
        />
        <p className={isV0 ? "text-sm text-white/50" : "text-sm text-zinc-500"}>
          Canonical content is stored as block JSON. HTML is generated from the editor for fallback rendering.
        </p>
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={panelClass}>
          <div className="space-y-1">
            <p className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>Image upload</p>
            <p className={isV0 ? "text-sm text-white/60" : "text-sm text-zinc-400"}>JPEG, PNG, WEBP up to 8MB. Uploading an image also sets the cover URL.</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading}
            onChange={(event) => {
              void uploadAssets("image", event.target.files)
              event.currentTarget.value = ""
            }}
            className={isV0 ? "block w-full text-xs text-white/70 file:mr-4 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-2 file:text-white" : "block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border file:border-[#D4FF00]/40 file:bg-transparent file:px-4 file:py-2 file:text-[#D4FF00]"}
          />
          {form.coverImageUrl ? (
            <div className="space-y-3">
              <img
                src={form.coverImageUrl}
                alt={form.title || "Cover image"}
                className={isV0 ? "h-48 w-full border border-white/20 object-cover" : "h-48 w-full rounded-2xl object-cover"}
              />
              <p className="text-xs text-zinc-500 break-all">{form.coverImageUrl}</p>
            </div>
          ) : null}
          {imageAssets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Stored images</p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {imageAssets.map((asset) => (
                  <li key={asset.id} className={`flex items-center justify-between gap-3 border ${isV0 ? "border-white/20" : "border-white/10 rounded-2xl"} px-3 py-2`}>
                    <div className="space-y-1">
                      <p>{asset.originalName}</p>
                      {asset.pendingDeleteAt ? (
                        <p className="text-xs text-amber-300">Queued for deletion</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className={secondaryButtonClass}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className={panelClass}>
          <div className="space-y-1">
            <p className={isV0 ? "text-xs text-white/50" : "text-xs uppercase tracking-[0.18em] text-zinc-500"}>File attachments</p>
            <p className={isV0 ? "text-sm text-white/60" : "text-sm text-zinc-400"}>PDF and TXT only. Private in storage, signed for download through the app.</p>
          </div>
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            multiple
            disabled={isUploading}
            onChange={(event) => {
              void uploadAssets("file", event.target.files)
              event.currentTarget.value = ""
            }}
            className={isV0 ? "block w-full text-xs text-white/70 file:mr-4 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-2 file:text-white" : "block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border file:border-[#D4FF00]/40 file:bg-transparent file:px-4 file:py-2 file:text-[#D4FF00]"}
          />
          {fileAssets.length > 0 ? (
            <ul className="space-y-2">
              {fileAssets.map((asset) => (
                <li
                  key={asset.id}
                  className={`flex items-center justify-between border ${isV0 ? "border-white/20" : "border-white/10 rounded-2xl"} px-3 py-3 text-sm text-zinc-300`}
                >
                  <div className="space-y-1">
                    <p>{asset.originalName}</p>
                    {asset.pendingDeleteAt ? (
                      <p className="text-xs text-amber-300">Queued for deletion</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#D4FF00] transition hover:text-white"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className={secondaryButtonClass}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={isV0 ? "text-sm text-white/50" : "text-sm text-zinc-500"}>No file attachments yet.</p>
          )}
        </div>
      </div>
    </form>
  )
}
