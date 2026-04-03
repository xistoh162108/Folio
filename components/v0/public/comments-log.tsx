"use client"

import { useEffect, useState } from "react"

import type { PostCommentDTO } from "@/lib/contracts/community"
import { formatLogTimestamp } from "@/components/v0/public/mappers"

const COMMENTS_PAGE_SIZE = 20

interface CommentsPageResponse {
  comments: PostCommentDTO[]
  pagination?: {
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function V0CommentsLog({
  postId,
  initialComments,
  canModerate,
  isDarkMode,
}: {
  postId: string
  initialComments: PostCommentDTO[]
  canModerate: boolean
  isDarkMode: boolean
}) {
  const [comments, setComments] = useState(initialComments)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState("")
  const [pin, setPin] = useState("")
  const [honeypot, setHoneypot] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [deletePinById, setDeletePinById] = useState<Record<string, string>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  useEffect(() => {
    void loadCommentsByPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function loadCommentsByPage(nextPage: number) {
    setIsLoadingComments(true)
    setError(null)

    try {
      const query = new URLSearchParams({
        page: String(nextPage),
        take: String(COMMENTS_PAGE_SIZE),
      })
      const response = await fetch(`/api/posts/${postId}/comments?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      })

      const data = (await response.json()) as CommentsPageResponse & { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load comments.")
      }

      setComments(data.comments)
      setPage(nextPage)
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load comments.")
    } finally {
      setIsLoadingComments(false)
    }
  }

  async function loadCommentsByCursor(direction: "forward" | "backward") {
    const cursor = direction === "forward" ? comments.at(-1)?.id : comments[0]?.id
    if (!cursor) {
      return
    }

    setIsLoadingComments(true)
    setError(null)

    try {
      const query = new URLSearchParams({
        cursor,
        take: String(COMMENTS_PAGE_SIZE),
        direction,
      })
      const response = await fetch(`/api/posts/${postId}/comments?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
      })

      const data = (await response.json()) as CommentsPageResponse & { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load comments.")
      }

      if (data.comments.length === 0) {
        return
      }

      setComments(data.comments)
      setPage(1)
      setTotalPages(1)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load comments.")
    } finally {
      setIsLoadingComments(false)
    }
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

      if (page === 1) {
        setComments((current) => [data.comment as PostCommentDTO, ...current].slice(0, COMMENTS_PAGE_SIZE))
      }

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

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => void loadCommentsByPage(Math.max(1, page - 1))}
          disabled={isLoadingComments || page <= 1}
          className={`${hoverBg} px-2 py-1 ${isLoadingComments || page <= 1 ? "opacity-50" : ""}`}
        >
          [prev page]
        </button>
        <button
          type="button"
          onClick={() => void loadCommentsByPage(page + 1)}
          disabled={isLoadingComments || page >= totalPages}
          className={`${hoverBg} px-2 py-1 ${isLoadingComments || page >= totalPages ? "opacity-50" : ""}`}
        >
          [next page]
        </button>
        <button
          type="button"
          onClick={() => void loadCommentsByCursor("backward")}
          disabled={isLoadingComments || comments.length === 0}
          className={`${hoverBg} px-2 py-1 ${isLoadingComments || comments.length === 0 ? "opacity-50" : ""}`}
        >
          [load newer]
        </button>
        <button
          type="button"
          onClick={() => void loadCommentsByCursor("forward")}
          disabled={isLoadingComments || comments.length === 0}
          className={`${hoverBg} px-2 py-1 ${isLoadingComments || comments.length === 0 ? "opacity-50" : ""}`}
        >
          [load older]
        </button>
        <p className={mutedText}>// latest-first [{page}/{totalPages}]</p>
      </div>

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
              <p className="whitespace-pre-wrap">{comment.message}</p>
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
      </div>
    </section>
  )
}
