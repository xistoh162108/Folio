"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import type { PostEditorInput } from "@/lib/contracts/posts"
import { archivePost, savePost } from "@/lib/actions/post.actions"
import { TiptapEditor } from "@/components/admin/tiptap-editor"

export function PostEditor({ initialPost }: { initialPost: PostEditorInput }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [tagsText, setTagsText] = useState(initialPost.tags.join(", "))
  const [form, setForm] = useState<PostEditorInput>(initialPost)

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  )

  const onSave = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await savePost({
        ...form,
        tags: parsedTags,
      })

      if (!result.success) {
        setMessage(result.error)
        return
      }

      setMessage("Saved.")
      router.replace(`/admin/posts/${result.id}`)
      router.refresh()
    })
  }

  const onArchive = () => {
    if (!form.id) return

    startTransition(async () => {
      const result = await archivePost(form.id!)

      if (!result.success) {
        setMessage(result.error)
        return
      }

      setMessage("Archived.")
      router.refresh()
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

      setForm((current) => ({
        ...current,
        coverImageUrl: kind === "image" ? result.url ?? current.coverImageUrl : current.coverImageUrl,
        assets: [
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
        ],
      }))
      setMessage(kind === "image" ? "Image uploaded and linked as cover." : "File uploaded.")
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

      return {
        ...current,
        coverImageUrl: shouldClearCover ? "" : current.coverImageUrl,
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

  return (
    <form onSubmit={onSave} className="space-y-6 rounded-3xl border border-white/10 bg-zinc-950/80 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Editor</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{form.id ? "Edit post" : "New post"}</h1>
        </div>
        <div className="flex gap-3">
          {form.id ? (
            <button
              type="button"
              onClick={onArchive}
              disabled={isPending}
              className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:opacity-50"
            >
              Archive
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message ? <p className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-300">{message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Title</span>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Slug</span>
          <input
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Type</span>
          <select
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PostEditorInput["type"] }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          >
            <option value="NOTE">Note</option>
            <option value="PROJECT">Project</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</span>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PostEditorInput["status"] }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Cover image URL</span>
          <input
            value={form.coverImageUrl ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Excerpt</span>
        <textarea
          value={form.excerpt ?? ""}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Tags</span>
        <input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="ai, infosec, project"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
        />
      </label>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Link cards and embeds</p>
            <p className="text-sm text-zinc-400">Add YouTube or website URLs. Preview metadata is fetched on save.</p>
          </div>
          <button
            type="button"
            onClick={addLink}
            className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black"
          >
            Add link
          </button>
        </div>

        {form.links.length > 0 ? (
          <div className="space-y-3">
            {form.links.map((link, index) => (
              <div key={`${link.url}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 p-4 md:grid-cols-[140px_1fr_1fr_auto]">
                <select
                  value={link.type ?? "WEBSITE"}
                  onChange={(event) => updateLink(index, { type: event.target.value as PostEditorInput["links"][number]["type"] })}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
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
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
                />
                <input
                  value={link.url}
                  onChange={(event) => updateLink(index, { url: event.target.value })}
                  placeholder="https://..."
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
                />
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="rounded-full border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:border-red-400 hover:text-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No structured links yet.</p>
        )}
      </div>

      <label className="block space-y-2">
        <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Body</span>
        <TiptapEditor
          initialContent={form.content}
          fallbackHtml={form.htmlContent}
          onChange={({ content, html }) =>
            setForm((current) => ({
              ...current,
              content,
              htmlContent: html,
            }))
          }
        />
        <p className="text-sm text-zinc-500">
          Canonical content is stored as block JSON. HTML is generated from the editor for fallback rendering.
        </p>
      </label>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Image upload</p>
            <p className="text-sm text-zinc-400">JPEG, PNG, WEBP up to 8MB. Uploading an image also sets the cover URL.</p>
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
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border file:border-[#D4FF00]/40 file:bg-transparent file:px-4 file:py-2 file:text-[#D4FF00]"
          />
          {form.coverImageUrl ? (
            <div className="space-y-3">
              <img
                src={form.coverImageUrl}
                alt={form.title || "Cover image"}
                className="h-48 w-full rounded-2xl object-cover"
              />
              <p className="text-xs text-zinc-500 break-all">{form.coverImageUrl}</p>
            </div>
          ) : null}
          {imageAssets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Stored images</p>
              <ul className="space-y-2 text-sm text-zinc-300">
                {imageAssets.map((asset) => (
                  <li key={asset.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-3 py-2">
                    <div className="space-y-1">
                      <p>{asset.originalName}</p>
                      {asset.pendingDeleteAt ? (
                        <p className="text-xs text-amber-300">Queued for deletion</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">File attachments</p>
            <p className="text-sm text-zinc-400">PDF and TXT only. Private in storage, signed for download through the app.</p>
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
            className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-full file:border file:border-[#D4FF00]/40 file:bg-transparent file:px-4 file:py-2 file:text-[#D4FF00]"
          />
          {fileAssets.length > 0 ? (
            <ul className="space-y-2">
              {fileAssets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-3 text-sm text-zinc-300"
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
                      className="rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">No file attachments yet.</p>
          )}
        </div>
      </div>
    </form>
  )
}
