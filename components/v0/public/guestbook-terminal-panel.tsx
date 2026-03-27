"use client"

import { useEffect, useRef, useState } from "react"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"

import { formatLogTimestamp } from "@/components/v0/public/mappers"

interface GuestbookTerminalPanelProps {
  isDarkMode: boolean
  borderColor: string
  hoverBg: string
  mutedText: string
  initialEntries?: GuestbookEntryDTO[]
  canModerate?: boolean
  autoFocus?: boolean
}

export function V0GuestbookTerminalPanel({
  isDarkMode,
  borderColor,
  hoverBg,
  mutedText,
  initialEntries = [],
  canModerate = false,
  autoFocus = false,
}: GuestbookTerminalPanelProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entries, setEntries] = useState(initialEntries)
  const [message, setMessage] = useState("")
  const [honey, setHoney] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    const frame = requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ block: "start" })
      sectionRef.current?.focus({ preventScroll: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [autoFocus])

  async function submitEntry() {
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

  async function moderateDelete(entryId: string) {
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
    <section ref={sectionRef} id="guestbook" className="scroll-mt-20 space-y-4 max-w-md" tabIndex={-1}>
      <div className="space-y-2">
        <p className={`text-xs ${mutedText}`}>// guestbook</p>
        <h3 className="text-sm">System logs from visitors</h3>
        <p className={`text-sm ${mutedText}`}>Append a short line. Logs should read like a terminal, not a feed.</p>
      </div>

      <div className={`border ${borderColor}`}>
        <div className={`grid grid-cols-[120px,1fr] gap-4 px-4 py-2 border-b ${borderColor} text-xs ${mutedText}`}>
          <span>source</span>
          <span>message</span>
        </div>
        {entries.length > 0 ? (
          entries.map((log) => (
            <div key={log.id} className={`grid grid-cols-[120px,1fr] gap-4 px-4 py-3 text-sm ${hoverBg}`}>
              <div className="space-y-1">
                <p className="text-xs">{log.sourceLabel}</p>
                <p className={`text-[11px] ${mutedText}`}>{formatLogTimestamp(log.createdAt)}</p>
              </div>
              <div className="space-y-2">
                <p className={mutedText}>{log.message}</p>
                {canModerate ? (
                  <button
                    type="button"
                    onClick={() => void moderateDelete(log.id)}
                    className={`v0-control-button-compact border ${borderColor} ${hoverBg} ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    [admin remove]
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className={`px-4 py-4 text-xs ${mutedText}`}>[ NO_GUEST_LOGS_YET ]</div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submitEntry()
        }}
        className="space-y-3"
      >
        <input
          value={honey}
          onChange={(event) => setHoney(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <p className={`text-xs ${mutedText}`}>// write log</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder='git commit -m "leave your trace_"'
            disabled={pending}
            maxLength={280}
            className={`v0-control-inline-input w-full min-w-[18rem] flex-1 ${borderColor} ${
              isDarkMode ? "text-white placeholder:text-white/30 focus:border-[#D4FF00]/50" : "text-black placeholder:text-black/30 focus:border-[#3F5200]/50"
            } ${pending ? "opacity-50" : ""}`}
          />
          <button
            type="submit"
            disabled={pending || message.trim().length === 0}
            className={`v0-control-inline-button ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
          >
            {pending ? "[ writing... ]" : "[ write log ]"}
          </button>
        </div>
        {error ? <p className="text-xs text-[#FF3333]">[ ERROR: {error} ]</p> : null}
      </form>
    </section>
  )
}
