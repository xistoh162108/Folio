"use client"

import Link from "next/link"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import { deleteCommentAsAdmin, deleteGuestbookEntryAsAdmin } from "@/lib/actions/community.actions"
import type { CommunityModerationSnapshot } from "@/lib/data/community"

interface CommunityScreenProps {
  snapshot: CommunityModerationSnapshot
  isDarkMode?: boolean
  brandLabel?: string
}

function formatTimestamp(value: string) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16)
}

function buildCommunityHref(commentPage: number, guestbookPage: number) {
  const params = new URLSearchParams()
  if (commentPage > 1) {
    params.set("commentPage", String(commentPage))
  }
  if (guestbookPage > 1) {
    params.set("guestbookPage", String(guestbookPage))
  }

  return params.size ? `/admin/community?${params.toString()}` : "/admin/community"
}

export function CommunityScreen({
  snapshot,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: CommunityScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const deleteButtonClass = `px-2 py-1 border ${borderColor} ${hoverBg}`

  return (
    <AdminShell currentSection="community" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <main className="flex-1 min-h-full p-4 sm:p-6 md:h-full md:min-h-0 md:overflow-y-auto">
        <div className="max-w-4xl space-y-8 pb-10">
          <div>
            <p className={`text-xs ${mutedText}`}>// community</p>
            <h2 className="text-lg mt-1">Moderation Queue</h2>
          </div>

          <section className="space-y-3">
            <div className={`flex items-center justify-between text-xs ${mutedText}`}>
              <p>--- COMMENTS ---</p>
              <p>
                [{snapshot.commentsPagination.total}] active / [page {snapshot.commentsPagination.page} of{" "}
                {snapshot.commentsPagination.totalPages}]
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {snapshot.commentsPagination.hasPrevious ? (
                <Link
                  href={buildCommunityHref(snapshot.commentsPagination.page - 1, snapshot.guestbookPagination.page)}
                  className={`${hoverBg} px-2 py-1`}
                >
                  [newer comments]
                </Link>
              ) : null}
              {snapshot.commentsPagination.hasNext ? (
                <Link
                  href={buildCommunityHref(snapshot.commentsPagination.page + 1, snapshot.guestbookPagination.page)}
                  className={`${hoverBg} px-2 py-1`}
                >
                  [older comments]
                </Link>
              ) : null}
            </div>
            <div className="space-y-1">
              {snapshot.comments.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-6 text-sm ${mutedText}`}>No active comments.</div>
              ) : null}
              {snapshot.comments.map((comment) => {
                const href = comment.postType === "NOTE" ? `/notes/${comment.postSlug}` : `/projects/${comment.postSlug}`

                return (
                  <div key={comment.id} className={`border ${borderColor} px-3 py-3 space-y-3 ${hoverBg}`}>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span>{comment.postType}</span>
                      <span className={mutedText}>{formatTimestamp(comment.createdAt)}</span>
                      <span className={mutedText}>{comment.sourceLabel}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <Link href={href} className={mutedText}>
                        {comment.postTitle}
                      </Link>
                      <form action={deleteCommentAsAdmin}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <button type="submit" className={deleteButtonClass}>
                          [delete]
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className={`flex items-center justify-between text-xs ${mutedText}`}>
              <p>--- GUESTBOOK ---</p>
              <p>
                [{snapshot.guestbookPagination.total}] active / [page {snapshot.guestbookPagination.page} of{" "}
                {snapshot.guestbookPagination.totalPages}]
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {snapshot.guestbookPagination.hasPrevious ? (
                <Link
                  href={buildCommunityHref(snapshot.commentsPagination.page, snapshot.guestbookPagination.page - 1)}
                  className={`${hoverBg} px-2 py-1`}
                >
                  [newer guestbook]
                </Link>
              ) : null}
              {snapshot.guestbookPagination.hasNext ? (
                <Link
                  href={buildCommunityHref(snapshot.commentsPagination.page, snapshot.guestbookPagination.page + 1)}
                  className={`${hoverBg} px-2 py-1`}
                >
                  [older guestbook]
                </Link>
              ) : null}
            </div>
            <div className="space-y-1">
              {snapshot.guestbookEntries.length === 0 ? (
                <div className={`border border-dashed ${borderColor} px-4 py-6 text-sm ${mutedText}`}>No active guestbook entries.</div>
              ) : null}
              {snapshot.guestbookEntries.map((entry) => (
                <div key={entry.id} className={`border ${borderColor} px-3 py-3 space-y-3 ${hoverBg}`}>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span>GUESTBOOK</span>
                    <span className={mutedText}>{formatTimestamp(entry.createdAt)}</span>
                    <span className={mutedText}>{entry.sourceLabel}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{entry.message}</p>
                  <div className="flex justify-end">
                    <form action={deleteGuestbookEntryAsAdmin}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button type="submit" className={deleteButtonClass}>
                        [delete]
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  )
}
