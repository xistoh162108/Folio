"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import type { GuestbookEntryDTO, PaginatedCollectionStateDTO } from "@/lib/contracts/community"

import { formatLogTimestamp } from "@/components/v0/public/mappers"
import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

interface GuestbookTerminalPanelProps {
  isDarkMode: boolean
  borderColor: string
  hoverBg: string
  mutedText: string
  initialEntries?: GuestbookEntryDTO[]
  initialPagination?: PaginatedCollectionStateDTO
  mode?: "preview" | "full"
  previewHref?: string
  previewLimit?: number
}

export function V0GuestbookTerminalPanel({
  isDarkMode,
  borderColor,
  hoverBg,
  mutedText,
  initialEntries = [],
  initialPagination,
  mode = "full",
  previewHref = "/guestbook",
  previewLimit = 2,
}: GuestbookTerminalPanelProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [entries, setEntries] = useState(initialEntries)
  const [pagination, setPagination] = useState<PaginatedCollectionStateDTO>(
    initialPagination ?? {
      page: 1,
      pageSize: Math.max(initialEntries.length, previewLimit, 1),
      total: initialEntries.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    },
  )
  const [message, setMessage] = useState("")
  const [honey, setHoney] = useState("")
  const [pending, setPending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewEntries = entries.slice(0, previewLimit)
  const isPreview = mode === "preview"
  const accentColor = getV0RouteAccentPalette("contact", isDarkMode).color
  const title = isPreview ? "Recent visitor logs" : "System logs from visitors"
  const description = isPreview
    ? "Compact trace preview. Full archive lives under /guestbook."
    : "Append a short line. Logs should read like a terminal, not a feed."

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  useEffect(() => {
    if (initialPagination) {
      setPagination(initialPagination)
    }
  }, [initialPagination])

  function updatePaginationTotal(nextTotal: number) {
    setPagination((current) => {
      const total = Math.max(0, nextTotal)
      const totalPages = Math.max(1, Math.ceil(total / current.pageSize))

      return {
        ...current,
        total,
        totalPages,
        hasPrevious: current.page > 1,
        hasNext: current.page < totalPages,
      }
    })
  }

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
      updatePaginationTotal(pagination.total + 1)
      setMessage("")
      setHoney("")
    } catch {
      setError("Could not write guest log.")
    } finally {
      setPending(false)
    }
  }

  async function loadOlderEntries() {
    if (loadingOlder || !pagination.hasNext) {
      return
    }

    setLoadingOlder(true)
    setError(null)

    try {
      const response = await fetch(`/api/guestbook?page=${pagination.page + 1}&pageSize=${pagination.pageSize}`)
      const result = (await response.json()) as {
        entries?: GuestbookEntryDTO[]
        pagination?: PaginatedCollectionStateDTO
        error?: string
      }

      if (!response.ok || !result.entries || !result.pagination) {
        setError(result.error ?? "Could not load older guest logs.")
        return
      }

      setEntries((current) => [...current, ...result.entries!])
      setPagination(result.pagination)
    } catch {
      setError("Could not load older guest logs.")
    } finally {
      setLoadingOlder(false)
    }
  }

  return (
    <section
      ref={sectionRef}
      id={isPreview ? "guestbook-preview" : "guestbook"}
      data-v0-guestbook-column
      className="scroll-mt-20 max-w-xl space-y-4"
      tabIndex={-1}
    >
      <div className={isPreview ? "space-y-1" : "space-y-2"}>
        <p className={`text-xs ${mutedText}`}>// guestbook</p>
        <h3 className="text-sm">{title}</h3>
        <p className={`${isPreview ? "text-xs" : "text-sm"} ${mutedText}`}>{description}</p>
      </div>

      <div className="space-y-1">
        {(isPreview ? previewEntries : entries).length > 0 ? (
          (isPreview ? previewEntries : entries).map((log) => (
            <div key={log.id} className={`space-y-1 px-1 py-1 -mx-1 text-sm ${hoverBg}`}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className={`shrink-0 text-xs ${mutedText}`}>{log.sourceLabel}</span>
                <span className={`shrink-0 text-xs ${mutedText}`}>-</span>
                <span className="min-w-[12rem] flex-1 break-words">{log.message}</span>
              </div>
              <p className={`pl-0 text-[11px] ${mutedText} sm:pl-[3.5rem]`}>{formatLogTimestamp(log.createdAt)}</p>
            </div>
          ))
        ) : (
          <div className={`px-1 py-2 text-xs ${mutedText}`}>[ NO_GUEST_LOGS_YET ]</div>
        )}
      </div>

      {isPreview ? (
        <div className={`flex items-center justify-between gap-3 border-t pt-3 text-xs ${borderColor}`}>
          <p className={mutedText}>// full archive and write access: /guestbook</p>
          <Link href={previewHref} className={`shrink-0 px-1 ${hoverBg}`}>
            [open guestbook -&gt;]
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submitEntry()
          }}
          className="space-y-3 border-t pt-3"
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
                isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
              } ${pending ? "opacity-50" : ""}`}
            />
            <button
              type="submit"
              disabled={pending || message.trim().length === 0}
              className={`v0-control-inline-button ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
              style={message.trim().length > 0 && !pending ? { borderColor: accentColor, color: accentColor } : undefined}
            >
              {pending ? "[ writing... ]" : "[ write log ]"}
            </button>
          </div>
          {error ? <p className="text-xs text-[#FF3333]">[ ERROR: {error} ]</p> : null}
        </form>
      )}
      {!isPreview && pagination.hasNext ? (
        <div className={`border-t pt-3 text-xs ${borderColor}`}>
          <button
            type="button"
            onClick={() => void loadOlderEntries()}
            disabled={loadingOlder}
            className={`${hoverBg} px-1 ${loadingOlder ? "opacity-50" : ""}`}
          >
            {loadingOlder ? "[ loading older logs... ]" : "[ older logs -> ]"}
          </button>
        </div>
      ) : null}
    </section>
  )
}
