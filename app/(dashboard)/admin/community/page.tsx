import Link from "next/link"

import { deleteCommentAsAdmin, deleteGuestbookEntryAsAdmin } from "@/lib/actions/community.actions"
import { getCommunityModerationSnapshot } from "@/lib/data/community"

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function AdminCommunityPage() {
  const snapshot = await getCommunityModerationSnapshot()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Community</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Comments and guest logs</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Public submissions are immediate. Moderation is soft-delete only and keeps the public feed free of spam without removing audit history from the database.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Post comments</h3>
            <span className="text-sm text-zinc-500">{snapshot.comments.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
                No active comments.
              </div>
            ) : null}
            {snapshot.comments.map((comment) => {
              const href = comment.postType === "NOTE" ? `/notes/${comment.postSlug}` : `/projects/${comment.postSlug}`
              return (
                <div key={comment.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                    <span>{formatTimestamp(comment.createdAt)}</span>
                    <span>{comment.sourceLabel}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{comment.message}</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <Link href={href} className="text-sm text-[#D4FF00] transition hover:text-white">
                      {comment.postTitle}
                    </Link>
                    <form action={deleteCommentAsAdmin}>
                      <input type="hidden" name="commentId" value={comment.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300 transition hover:border-white/30 hover:text-white"
                      >
                        Soft delete
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Guestbook</h3>
            <span className="text-sm text-zinc-500">{snapshot.guestbookEntries.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.guestbookEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-zinc-500">
                No active guest logs.
              </div>
            ) : null}
            {snapshot.guestbookEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                  <span>{formatTimestamp(entry.createdAt)}</span>
                  <span>{entry.sourceLabel}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{entry.message}</p>
                <div className="mt-4 flex justify-end">
                  <form action={deleteGuestbookEntryAsAdmin}>
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-300 transition hover:border-white/30 hover:text-white"
                    >
                      Soft delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
