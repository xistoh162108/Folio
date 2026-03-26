"use client"

import { useState } from "react"

import type { PostCommentDTO } from "@/lib/contracts/community"

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CommentsSection({
  postId,
  initialComments,
  canModerate,
}: {
  postId: string
  initialComments: PostCommentDTO[]
  canModerate: boolean
}) {
  const [comments, setComments] = useState(initialComments)
  const [message, setMessage] = useState("")
  const [pin, setPin] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletePinById, setDeletePinById] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function createComment() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          pin,
          _honey: honeypot,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Could not write comment.")
      }

      setComments((current) => [data.comment as PostCommentDTO, ...current])
      setMessage("")
      setPin("")
      setHoneypot("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not write comment.")
    } finally {
      setPending(false)
    }
  }

  async function deleteComment(commentId: string) {
    setDeletingId(commentId)
    setError(null)

    try {
      const response = await fetch(`/api/comments/${commentId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: deletePinById[commentId] ?? "",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Could not delete comment.")
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId))
      setDeletePinById((current) => {
        const next = { ...current }
        delete next[commentId]
        return next
      })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete comment.")
    } finally {
      setDeletingId(null)
    }
  }

  async function moderateDelete(commentId: string) {
    setDeletingId(commentId)
    setError(null)

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "POST",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Could not moderate comment.")
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not moderate comment.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-zinc-950/60 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Comments</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Anonymous commit log</h2>
        </div>
        <p className="font-mono text-xs text-zinc-500">{comments.length} logs</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          void createComment()
        }}
      >
        <input
          type="text"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder='git commit -m "write your log_"'
          rows={3}
          maxLength={500}
          disabled={pending}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4FF00]/40"
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="PIN_"
            inputMode="numeric"
            maxLength={4}
            disabled={pending}
            className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none transition focus:border-[#D4FF00]/40 md:max-w-[180px]"
          />
          <button
            type="submit"
            disabled={pending || message.trim().length === 0 || pin.length !== 4}
            className="rounded-full border border-[#D4FF00]/35 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "[ writing... ]" : "[ write log ]"}
          </button>
          <p className="text-xs text-zinc-500">Use the same 4-digit PIN later if you want to delete your own comment.</p>
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
            No comments yet. Write the first log entry.
          </div>
        ) : null}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              <span>commit {comment.id.slice(0, 8)}</span>
              <span>{comment.sourceLabel}</span>
              <span>{formatTimestamp(comment.createdAt)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{comment.message}</p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
              <input
                value={deletePinById[comment.id] ?? ""}
                onChange={(event) =>
                  setDeletePinById((current) => ({
                    ...current,
                    [comment.id]: event.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                placeholder="PIN to delete"
                inputMode="numeric"
                maxLength={4}
                className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none transition focus:border-[#D4FF00]/40 md:max-w-[180px]"
              />
              <button
                type="button"
                onClick={() => void deleteComment(comment.id)}
                disabled={deletingId === comment.id || (deletePinById[comment.id] ?? "").length !== 4}
                className="rounded-full border border-white/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-zinc-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletingId === comment.id ? "[ deleting... ]" : "[ delete with PIN ]"}
              </button>
              {canModerate ? (
                <button
                  type="button"
                  onClick={() => void moderateDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="rounded-full border border-rose-400/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-rose-300 transition hover:border-rose-300 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingId === comment.id ? "[ moderating... ]" : "[ admin remove ]"}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
