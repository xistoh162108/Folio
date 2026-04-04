"use client"

import { useState } from "react"

import type { PaginatedCollectionStateDTO, PostCommentDTO } from "@/lib/contracts/community"
import { formatLogTimestamp } from "@/components/v0/public/mappers"

export function V0CommentsLog({
  postId,
  initialComments,
  initialCommentsPagination,
  canModerate,
  isDarkMode,
}: {
  postId: string
  initialComments: PostCommentDTO[]
  initialCommentsPagination: PaginatedCollectionStateDTO
  canModerate: boolean
  isDarkMode: boolean
}) {
  const [comments, setComments] = useState(initialComments)
  const [pagination, setPagination] = useState(initialCommentsPagination)
  const [message, setMessage] = useState("")
  const [pin, setPin] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [deletePinById, setDeletePinById] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const commentText = isDarkMode ? "text-white/85" : "text-black/85"

  function updatePaginationTotal(nextTotal: number) {
    setPagination((current) => {
      const total = Math.max(0, nextTotal)
      const totalPages = Math.max(1, Math.ceil(total / current.pageSize))

      return {
        ...current,
        total,
        totalPages,
        hasNext: current.page < totalPages,
        hasPrevious: current.page > 1,
      }
    })
  }

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
      updatePaginationTotal(pagination.total + 1)
      setMessage("")
      setPin("")
      setHoneypot("")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not write comment.")
    } finally {
      setPending(false)
    }
  }

  async function loadOlderComments() {
    if (loadingOlder || !pagination.hasNext) {
      return
    }

    setLoadingOlder(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}/comments?page=${pagination.page + 1}&pageSize=${pagination.pageSize}`)
      const data = (await response.json()) as {
        comments?: PostCommentDTO[]
        pagination?: PaginatedCollectionStateDTO
        error?: string
      }

      if (!response.ok || !data.comments || !data.pagination) {
        throw new Error(data.error ?? "Could not load older comments.")
      }

      setComments((current) => [...current, ...data.comments!])
      setPagination(data.pagination)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load older comments.")
    } finally {
      setLoadingOlder(false)
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
      updatePaginationTotal(pagination.total - 1)
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
      updatePaginationTotal(pagination.total - 1)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not moderate comment.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className={`pt-8 border-t ${borderColor} space-y-4`}>
      <p className={`text-xs ${mutedText}`}>// comments</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void createComment()
        }}
        className="space-y-3"
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
          className={`w-full bg-transparent border-b ${borderColor} pb-1 pt-0 text-sm outline-none resize-none transition-colors leading-tight ${
            isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
          } ${pending ? "opacity-50" : ""}`}
        />
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="PIN_"
            inputMode="numeric"
            maxLength={4}
            disabled={pending}
            className={`bg-transparent border-b ${borderColor} py-1 outline-none transition-colors ${
              isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
            } ${pending ? "opacity-50" : ""}`}
          />
          <button
            type="submit"
            disabled={pending || message.trim().length === 0 || pin.length !== 4}
            className={`${hoverBg} px-2 py-1 ${pending ? "opacity-50" : ""}`}
          >
            {pending ? "[writing...]" : "[write log]"}
          </button>
          <p className={mutedText}>// use the same 4-digit PIN to delete your own comment</p>
        </div>
        {error ? <p className="text-xs text-[#FF3333]">[ ERROR: {error} ]</p> : null}
      </form>

      <div className={`border ${borderColor}`}>
        {comments.length === 0 ? <p className={`px-3 py-3 text-xs ${mutedText}`}>// no comments yet</p> : null}
        {comments.map((comment, index) => (
          <div
            key={comment.id}
            data-comment-row={comment.id}
            className={`grid gap-3 px-3 py-3 text-sm md:grid-cols-[180px_1fr] ${
              index === 0 ? "" : `border-t ${borderColor}`
            }`}
          >
            <div className={`space-y-1 text-xs ${mutedText}`}>
              <p>{comment.sourceLabel}</p>
              <p>{formatLogTimestamp(comment.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <p className={`whitespace-pre-wrap ${commentText}`}>{comment.message}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <input
                  value={deletePinById[comment.id] ?? ""}
                  onChange={(event) =>
                    setDeletePinById((current) => ({
                      ...current,
                      [comment.id]: event.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  placeholder="PIN_"
                  inputMode="numeric"
                  maxLength={4}
                  className={`bg-transparent border-b ${borderColor} py-1 outline-none transition-colors ${
                    isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => void deleteComment(comment.id)}
                  disabled={deletingId === comment.id || (deletePinById[comment.id] ?? "").length !== 4}
                  className={`${hoverBg} px-2 py-1 ${deletingId === comment.id ? "opacity-50" : ""}`}
                >
                  {deletingId === comment.id ? "[...]" : "[delete]"}
                </button>
                {canModerate ? (
                  <button
                    type="button"
                    onClick={() => void moderateDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"} ${
                      deletingId === comment.id ? "opacity-50" : ""
                    }`}
                  >
                    [admin remove]
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {pagination.hasNext ? (
          <div className={`border-t px-3 py-3 text-xs ${borderColor}`}>
            <button
              type="button"
              onClick={() => void loadOlderComments()}
              disabled={loadingOlder}
              className={`${hoverBg} px-2 py-1 ${loadingOlder ? "opacity-50" : ""}`}
            >
              {loadingOlder ? "[loading older logs...]" : "[older comments ->]"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
