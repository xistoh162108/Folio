"use client"

import Link from "next/link"
import { startTransition, useActionState, useMemo, useState } from "react"

import type { PostCardDTO } from "@/lib/contracts/posts"
import { requestSubscription } from "@/lib/actions/subscriber.actions"

import { digitalGardenNotes, tagFilters } from "@/components/v0/fixtures"
import { mapPostCardToNoteRow } from "@/components/v0/public/mappers"
import { PublicShell } from "@/components/v0/public/public-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

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

  return (
    <PublicShell currentPage="notes" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="h-full px-8 py-6 overflow-y-auto pb-32">
        <div className="space-y-6 max-w-lg">
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
                    className={`flex items-baseline gap-3 text-sm ${hoverBg} py-2 px-2 -mx-2 transition-colors w-full text-left`}
                  >
                    <span className={`${mutedText} w-20 shrink-0`}>{note.date}</span>
                    <span className={`${mutedText} w-8 shrink-0`}>{note.statusSymbol}</span>
                    <span className="flex-1">{note.title}</span>
                    <span className={`${mutedText} text-xs shrink-0`}>[v: {note.views.toLocaleString()}]</span>
                    <span className={`${mutedText} text-xs`}>{note.tags.join(" ")}</span>
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

      <div className={`fixed bottom-0 left-0 w-1/2 ${bgColor} border-t ${borderColor} px-8 py-4 font-mono z-30`}>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            startTransition(() => formAction({ email, _honey: honey, topics }))
          }}
          className="max-w-lg space-y-2"
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <p className={`text-xs leading-8 ${mutedText}`}>// stay in the loop</p>
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
                className={`v0-control-inline-input w-40 ${borderColor} ${
                  isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
                } ${pending ? "opacity-50" : ""}`}
              />
              <button
                type="submit"
                disabled={pending}
                className={`v0-control-inline-button ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
              >
                {pending ? "[...]" : "Subscribe"}
              </button>
            </div>
            <div className="flex gap-3 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
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
              <label className="flex items-center gap-1 cursor-pointer">
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
              <label className="flex items-center gap-1 cursor-pointer">
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
            </div>
          </div>
          {state?.success ? (
            <p className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[ OK: {state.message} ]</p>
          ) : null}
          {state?.error ? <p className="text-xs text-[#FF3333]">[ ERROR: {state.error} ]</p> : null}
        </form>
      </div>
    </PublicShell>
  )
}
