"use client"

import { useState } from "react"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function GuestbookLog({
  initialEntries,
  canModerate,
}: {
  initialEntries: GuestbookEntryDTO[]
  canModerate: boolean
}) {
  const [entries, setEntries] = useState(initialEntries)
  const [message, setMessage] = useState("")
  const [honey, setHoney] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitEntry = async () => {
    if (pending) return

    setPending(true)
    setError(null)

    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          _honey: honey,
        }),
      })

      const result = (await response.json()) as { error?: string; entry?: GuestbookEntryDTO }
      if (!response.ok || !result.entry) {
        setError(result.error ?? "Could not write guest log.")
        return
      }

      setEntries((current) => [result.entry!, ...current])
      setMessage("")
      setHoney("")
    } catch {
      setError("Could not write guest log.")
    } finally {
      setPending(false)
    }
  }

  const moderateDelete = async (entryId: string) => {
    setError(null)

    const response = await fetch(`/api/admin/guestbook/${entryId}`, {
      method: "POST",
    })

    const result = (await response.json()) as { error?: string }
    if (!response.ok) {
      setError(result.error ?? "Could not moderate guest log.")
      return
    }

    setEntries((current) => current.filter((entry) => entry.id !== entryId))
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Write log</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="write your log_"
            className="flex-1 rounded-full border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4FF00]/50"
          />
          <input
            value={honey}
            onChange={(event) => setHoney(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <button
            type="button"
            onClick={submitEntry}
            disabled={pending || message.trim().length === 0}
            className="rounded-full border border-[#D4FF00]/35 px-5 py-3 font-mono text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            append
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 px-5 py-8 text-sm text-zinc-500">
            No guest logs yet.
          </div>
        ) : null}
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-3xl border border-white/10 bg-black/30 px-5 py-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              [{formatTimestamp(entry.createdAt)}] GUEST_LOG from [{entry.sourceLabel}]
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-200">&quot;{entry.message}&quot;</p>
            {canModerate ? (
              <button
                type="button"
                onClick={() => void moderateDelete(entry.id)}
                className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-rose-400 transition hover:text-rose-300"
              >
                admin remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
