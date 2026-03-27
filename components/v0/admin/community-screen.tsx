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

export function CommunityScreen({
  snapshot,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: CommunityScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  return (
    <AdminShell currentSection="community" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-8 max-w-4xl">
          <div>
            <p className={`text-xs ${mutedText}`}>// community</p>
            <h2 className="text-lg mt-1">Moderation Queue</h2>
          </div>

          <section className="space-y-3">
            <div className={`flex items-center justify-between text-xs ${mutedText}`}>
              <p>--- COMMENTS ---</p>
              <p>[{snapshot.comments.length}] active</p>
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
                        <button type="submit" className={`px-2 py-1 border ${borderColor} ${hoverBg}`}>
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
              <p>[{snapshot.guestbookEntries.length}] active</p>
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
                      <button type="submit" className={`px-2 py-1 border ${borderColor} ${hoverBg}`}>
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
