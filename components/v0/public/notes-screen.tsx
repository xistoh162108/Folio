"use client"

import Link from "next/link"
import { startTransition, useActionState, useMemo, useState } from "react"

import type { PostCardDTO } from "@/lib/contracts/posts"
import { requestSubscription } from "@/lib/actions/subscriber.actions"

import { digitalGardenNotes, tagFilters } from "@/components/v0/fixtures"
import { mapPostCardToNoteRow } from "@/components/v0/public/mappers"
import { PublicShell } from "@/components/v0/public/public-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

interface NotesScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  notes?: PostCardDTO[]
}

const notesPerPage = 5

export function NotesScreen({ isDarkMode: initialIsDarkMode = true, brandLabel = "xistoh.log", notes }: NotesScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const [activeTagFilter, setActiveTagFilter] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [email, setEmail] = useState("")
  const [honey, setHoney] = useState("")
  const [topics, setTopics] = useState({
    all: true,
    aiInfosec: false,
    projectsLogs: false,
  })
  const [state, formAction, pending] = useActionState(
    async (
      _previous: { success?: boolean; message?: string; error?: string } | null,
      payload: { email: string; _honey: string; topics: typeof topics },
    ) => {
      const result = await requestSubscription(payload)
      if (result.success) {
        setEmail("")
        setHoney("")
      }
      return result
    },
    null,
  )

  const bgColor = isDarkMode ? "bg-black" : "bg-white"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"
  const accentColor = getV0RouteAccentPalette("notes", isDarkMode).color

  const noteRows = useMemo(
    () =>
      notes?.map((note) => mapPostCardToNoteRow(note)) ??
      digitalGardenNotes.map((note) => ({
        id: note.id,
        href: "#",
        title: note.title,
        date: note.date,
        tags: note.tags,
        filterTags: note.tags,
        views: note.views,
        statusSymbol: note.status === "seedling" ? "[*]" : note.status === "growing" ? "[+]" : "[>]",
      })),
    [notes],
  )

  const filteredNotes = useMemo(
    () => (activeTagFilter === "All" ? noteRows : noteRows.filter((note) => note.filterTags.includes(activeTagFilter))),
    [activeTagFilter, noteRows],
  )

  const totalPages = Math.ceil(filteredNotes.length / notesPerPage)
  const paginatedNotes = filteredNotes.slice((currentPage - 1) * notesPerPage, currentPage * notesPerPage)

  const toggleTopic = (topic: keyof typeof topics) => {
    if (topic === "all") {
      setTopics({ all: true, aiInfosec: false, projectsLogs: false })
      return
    }

    setTopics((previous) => ({
      ...previous,
      all: false,
      [topic]: !previous[topic],
    }))
  }
  const statusText = state?.success ? `[ OK: ${state.message} ]` : state?.error ? `[ ERROR: ${state.error} ]` : null
  const statusClassName = state?.error ? "text-[#FF3333]" : mutedText

  return (
    <PublicShell currentPage="notes" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="min-h-full px-4 py-6 pb-8 sm:px-6 md:h-full md:overflow-y-auto md:px-8 md:pb-32">
        <div className="space-y-6 max-w-lg md:max-w-none">
            <section className="space-y-3">
              <p className={`text-xs ${mutedText}`}>// digital garden</p>
              <h2 className="text-lg">Notes &amp; Seeds</h2>
              <p className={`text-sm ${mutedText}`}>[*] seedling | [+] growing | [&gt;] evergreen</p>
            </section>

            <div className="flex gap-2 text-xs">
              {tagFilters.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTagFilter(tag)
                    setCurrentPage(1)
                  }}
                  className={`px-2 py-1 border ${borderColor} transition-colors ${
                    activeTagFilter === tag ? activeBg : hoverBg
                  }`}
                >
                  [{tag}]
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {paginatedNotes.length > 0 ? (
                paginatedNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={note.href}
                    data-v0-note-row
                    className={`-mx-2 grid w-full grid-cols-[11ch_4ch_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 px-2 py-2 text-left text-sm transition-colors md:flex md:flex-nowrap ${hoverBg}`}
                  >
                    <span className={`${mutedText} col-start-1 row-start-1 w-[11ch] shrink-0 whitespace-nowrap md:w-20`}>{note.date}</span>
                    <span className={`${mutedText} col-start-2 row-start-1 w-[4ch] shrink-0 whitespace-nowrap md:w-8`}>{note.statusSymbol}</span>
                    <span className="col-start-3 row-start-1 min-w-0 flex-1">{note.title}</span>
                    <div className={`${mutedText} col-start-3 row-start-2 flex min-w-0 flex-wrap items-baseline gap-x-2 text-xs md:hidden`}>
                      <span className="shrink-0 whitespace-nowrap">[v: {note.views.toLocaleString()}]</span>
                      <span className="min-w-0">{note.tags.join(" ")}</span>
                    </div>
                    <span className={`${mutedText} hidden shrink-0 whitespace-nowrap text-xs md:inline`}>[v: {note.views.toLocaleString()}]</span>
                    <span className={`${mutedText} hidden text-xs md:w-auto md:shrink-0 md:whitespace-nowrap md:inline`}>
                      {note.tags.join(" ")}
                    </span>
                  </Link>
                ))
              ) : (
                <div className={`py-2 px-2 -mx-2 text-sm ${mutedText}`}>
                  {noteRows.length === 0 ? "[ NO_PUBLISHED_NOTES ]" : "[ NO_MATCHING_NOTES ]"}
                </div>
              )}
            </div>

            {totalPages > 1 ? (
              <div className={`flex items-center justify-center gap-2 text-xs ${mutedText} pt-4`}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 ${currentPage === 1 ? "opacity-30" : hoverBg}`}
                >
                  [&lt;]
                </button>
                <span>
                  {(currentPage - 1) * notesPerPage + 1}-{Math.min(currentPage * notesPerPage, filteredNotes.length)} /{" "}
                  {filteredNotes.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 ${currentPage === totalPages ? "opacity-30" : hoverBg}`}
                >
                  [&gt;]
                </button>
              </div>
            ) : null}
        </div>
      </div>

      <div
        className={`mt-8 border-t px-4 py-4 font-mono sm:px-6 md:fixed md:bottom-0 md:left-0 md:z-30 md:mt-0 md:w-[56%] md:px-6 lg:w-1/2 lg:px-8 ${bgColor} ${borderColor}`}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            startTransition(() => formAction({ email, _honey: honey, topics }))
          }}
          data-v0-notes-subscribe
          className="max-w-lg lg:max-w-none"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:flex-nowrap md:items-baseline md:gap-4">
            <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-2 md:w-auto md:flex-nowrap md:items-baseline md:gap-3">
              <p data-v0-stay-in-loop-label className={`v0-control-inline-label whitespace-nowrap ${mutedText}`}>// stay in the loop</p>
              <input
                type="text"
                name="_honey"
                value={honey}
                onChange={(event) => setHoney(event.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                disabled={pending}
                className={`v0-control-inline-input min-w-[12rem] flex-1 md:w-40 md:flex-none ${borderColor} ${
                  isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
                } ${pending ? "opacity-50" : ""}`}
              />
              <button
                type="submit"
                disabled={pending}
                className={`v0-control-inline-button shrink-0 ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
              >
                Subscribe
              </button>
            </div>
            <div
              data-v0-notes-topic-strip
              className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-xs md:ml-auto md:w-auto md:flex-nowrap md:items-baseline md:gap-4 md:whitespace-nowrap"
            >
              <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggleTopic("all")}
                  className={`v0-control-toggle ${borderColor} ${
                    topics.all ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                  }`}
                >
                  {topics.all ? "*" : ""}
                </button>
                <span className={mutedText}>All</span>
              </label>
              <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggleTopic("aiInfosec")}
                  className={`v0-control-toggle ${borderColor} ${
                    topics.aiInfosec ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                  }`}
                >
                  {topics.aiInfosec ? "*" : ""}
                </button>
                <span className={mutedText}>AI</span>
              </label>
              <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                <button
                  type="button"
                  onClick={() => toggleTopic("projectsLogs")}
                  className={`v0-control-toggle ${borderColor} ${
                    topics.projectsLogs ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                  }`}
                >
                  {topics.projectsLogs ? "*" : ""}
                </button>
                <span className={mutedText}>Projects</span>
              </label>
              {statusText ? (
                <span
                  className={`${statusClassName} shrink-0 whitespace-nowrap`}
                  style={state?.success ? { color: accentColor } : undefined}
                >
                  {statusText}
                </span>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </PublicShell>
  )
}
