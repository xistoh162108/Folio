"use client";

import Link from "next/link";
import { startTransition, useActionState, useMemo, useState } from "react";

import type { PostCardDTO } from "@/lib/contracts/posts";
import type { PublicTagFilterOption } from "@/lib/data/posts";
import { requestSubscription } from "@/lib/actions/subscriber.actions";

import { digitalGardenNotes } from "@/components/v0/fixtures";
import { mapFixtureNoteToNoteRow, mapPostCardToNoteRow } from "@/components/v0/public/mappers";
import { PublicShell } from "@/components/v0/public/public-shell";
import { getNotesSubscribeRenderState } from "@/components/v0/public/notes-subscribe-state";
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller";
import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette";

interface NotesScreenProps {
  isDarkMode?: boolean;
  brandLabel?: string;
  notes?: PostCardDTO[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  searchQuery?: string;
  selectedTag?: string | null;
  tagOptions?: PublicTagFilterOption[];
  rssHref?: string;
}

export function NotesScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  notes,
  pagination = {
    page: 1,
    pageSize: 5,
    total: notes?.length ?? digitalGardenNotes.length,
    totalPages: 1,
  },
  searchQuery = "",
  selectedTag = null,
  tagOptions = [],
  rssHref = "/notes/rss.xml",
}: NotesScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode);
  const [email, setEmail] = useState("");
  const [honey, setHoney] = useState("");
  const [topics, setTopics] = useState({
    all: true,
    projectInfo: false,
    log: false,
  });
  const [state, formAction, pending] = useActionState(
    async (
      _previous: { success?: boolean; message?: string; error?: string } | null,
      payload: { email: string; _honey: string; topics: typeof topics },
    ) => {
      const result = await requestSubscription(payload);
      if (result.success) {
        setEmail("");
        setHoney("");
      }
      return result;
    },
    null,
  );

  const bgColor = isDarkMode ? "bg-black" : "bg-white";
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50";
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20";
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10";
  const accentColor = getV0RouteAccentPalette("notes", isDarkMode).color;
  const resolvedTagOptions = useMemo(
    () => [{ label: "All", value: "all" }, ...tagOptions],
    [tagOptions],
  );
  const buildListHref = (next: {
    q?: string | null;
    tag?: string | null;
    page?: number | null;
  }) => {
    const params = new URLSearchParams();
    const q = (next.q ?? searchQuery).trim();
    const tag = next.tag === undefined ? selectedTag : next.tag;
    const page = next.page ?? 1;

    if (q) {
      params.set("q", q);
    }

    if (tag) {
      params.set("tag", tag);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();
    return queryString ? `/notes?${queryString}` : "/notes";
  };

  const noteRows = useMemo(
    () =>
      notes?.map((note) => mapPostCardToNoteRow(note)) ??
      digitalGardenNotes.map((note) => mapFixtureNoteToNoteRow(note)),
    [notes],
  );

  const toggleTopic = (topic: keyof typeof topics) => {
    if (topic === "all") {
      setTopics({ all: true, projectInfo: false, log: false });
      return;
    }

    setTopics((previous) => ({
      ...previous,
      all: false,
      [topic]: !previous[topic],
    }));
  };
  const {
    isSuccessState,
    shouldRenderError,
    statusText,
    successLiveRegion,
  } = getNotesSubscribeRenderState(state);
  const statusClassName = state?.error ? "text-[#FF3333]" : mutedText;

  return (
    <PublicShell
      currentPage="notes"
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
    >
      <div className="min-h-full px-4 py-6 pb-8 sm:px-6 md:h-full md:px-8 md:pb-32">
        <div className="space-y-6 max-w-lg md:max-w-none">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className={`text-xs ${mutedText}`}>// digital garden</p>
              <a href={rssHref} className={`text-xs ${mutedText} ${hoverBg} px-1`}>
                [rss -&gt;]
              </a>
            </div>
            <h2 className="text-lg">Notes &amp; Seeds</h2>
          </section>

          <form action="/notes" className="flex flex-wrap items-center gap-3 text-xs">
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="search notes_"
              className={`v0-control-inline-input min-w-[14rem] flex-1 ${borderColor} ${
                isDarkMode
                  ? "text-white placeholder:text-white/30"
                  : "text-black placeholder:text-black/30"
              }`}
            />
            {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
            <button type="submit" className={`v0-control-inline-button ${borderColor} ${hoverBg}`}>
              search
            </button>
            {(searchQuery || selectedTag) ? (
              <Link href="/notes" className={`v0-control-inline-button ${borderColor} ${hoverBg}`}>
                [reset]
              </Link>
            ) : null}
          </form>

          <div className="flex flex-wrap gap-2 text-xs">
            {resolvedTagOptions.map((tag) => (
              <Link
                key={tag.value}
                href={tag.value === "all" ? buildListHref({ tag: null, page: 1 }) : buildListHref({ tag: tag.value, page: 1 })}
                className={`px-2 py-1 border transition-colors ${borderColor} ${
                  (tag.value === "all" && !selectedTag) || selectedTag === tag.value ? activeBg : hoverBg
                }`}
              >
                [{tag.label}]
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            {noteRows.length > 0 ? (
              noteRows.map((note) => (
                <Link
                  key={note.id}
                  href={note.href}
                  data-v0-note-row
                  className={`-mx-2 grid w-full grid-cols-[11ch_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 px-2 py-2 text-left text-sm transition-colors md:flex md:flex-nowrap ${hoverBg}`}
                >
                  <span
                    className={`${mutedText} col-start-1 row-start-1 w-[11ch] shrink-0 whitespace-nowrap md:w-20`}
                  >
                    {note.date}
                  </span>
                  <span className="col-start-2 row-start-1 min-w-0 flex-1">
                    {note.title}
                  </span>
                  <div
                    className={`${mutedText} col-start-2 row-start-2 flex min-w-0 flex-wrap items-baseline gap-x-2 text-xs md:hidden`}
                  >
                    <span className="shrink-0 whitespace-nowrap">
                      [v: {note.views.toLocaleString()}]
                    </span>
                    <span className="min-w-0">{note.tags.join(" ")}</span>
                  </div>
                  <span
                    className={`${mutedText} hidden shrink-0 whitespace-nowrap text-xs md:inline`}
                  >
                    [v: {note.views.toLocaleString()}]
                  </span>
                  <span
                    className={`${mutedText} hidden text-xs md:w-auto md:shrink-0 md:whitespace-nowrap md:inline`}
                  >
                    {note.tags.join(" ")}
                  </span>
                </Link>
              ))
            ) : (
              <div className={`py-2 px-2 -mx-2 text-sm ${mutedText}`}>
                {notes?.length === 0 ? "[ NO_MATCHING_NOTES ]" : "[ NO_PUBLISHED_NOTES ]"}
              </div>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div
              className={`flex items-center justify-center gap-2 text-xs ${mutedText} pt-4`}
            >
              <Link
                href={buildListHref({ page: Math.max(1, pagination.page - 1) })}
                aria-disabled={pagination.page === 1}
                className={`px-2 py-1 ${pagination.page === 1 ? "pointer-events-none opacity-30" : hoverBg}`}
              >
                [&lt;]
              </Link>
              <span>
                {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} /{" "}
                {pagination.total}
              </span>
              <Link
                href={buildListHref({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                aria-disabled={pagination.page === pagination.totalPages}
                className={`px-2 py-1 ${
                  pagination.page === pagination.totalPages ? "pointer-events-none opacity-30" : hoverBg
                }`}
              >
                [&gt;]
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-8 border-t px-4 py-4 font-mono sm:px-6 md:fixed md:bottom-0 md:left-0 md:z-30 md:mt-0 md:w-[56%] md:px-6 lg:w-1/2 lg:px-8 ${bgColor} ${borderColor}`}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => formAction({ email, _honey: honey, topics }));
          }}
          data-v0-notes-subscribe
          className="max-w-lg space-y-2 lg:max-w-none"
        >
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
          {isSuccessState ? (
            <div
              data-v0-notes-subscribe-success
              className="space-y-2"
            >
              <p
                data-v0-stay-in-loop-label
                className={`v0-control-inline-label ${mutedText}`}
              >
                // stay in the loop
              </p>
              <p
                aria-live={successLiveRegion}
                className="text-xs break-words"
                style={{ color: accentColor }}
              >
                {statusText}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-start gap-3 2xl:flex-row 2xl:items-center 2xl:gap-6">
                <div className="flex min-w-0 w-full flex-wrap items-center gap-3 md:gap-4 2xl:flex-1 2xl:flex-nowrap">
                  <p
                    data-v0-stay-in-loop-label
                    className={`v0-control-inline-label ${mutedText} md:whitespace-nowrap`}
                  >
                    // stay in the loop
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@email.com"
                    disabled={pending}
                    className={`v0-control-inline-input min-w-[12rem] flex-1 md:w-40 md:flex-none ${borderColor} ${
                      isDarkMode
                        ? "text-white placeholder:text-white/30"
                        : "text-black placeholder:text-black/30"
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
                  className="flex min-w-fit flex-wrap items-center gap-3 text-xs md:flex-nowrap md:gap-4 md:whitespace-nowrap 2xl:ml-auto"
                >
                  <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleTopic("all")}
                      className={`v0-control-toggle ${borderColor} ${
                        topics.all
                          ? isDarkMode
                            ? "bg-white/20"
                            : "bg-black/20"
                          : ""
                      }`}
                    >
                      {topics.all ? "*" : ""}
                    </button>
                    <span className={mutedText}>All</span>
                  </label>
                  <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleTopic("projectInfo")}
                      className={`v0-control-toggle ${borderColor} ${
                        topics.projectInfo
                          ? isDarkMode
                            ? "bg-white/20"
                            : "bg-black/20"
                          : ""
                      }`}
                    >
                      {topics.projectInfo ? "*" : ""}
                    </button>
                    <span className={mutedText}>Project &amp; Info</span>
                  </label>
                  <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
                    <button
                      type="button"
                      onClick={() => toggleTopic("log")}
                      className={`v0-control-toggle ${borderColor} ${
                        topics.log
                          ? isDarkMode
                            ? "bg-white/20"
                            : "bg-black/20"
                          : ""
                      }`}
                    >
                      {topics.log ? "*" : ""}
                    </button>
                    <span className={mutedText}>Log</span>
                  </label>
                </div>
              </div>
              {shouldRenderError && statusText ? (
                <p className={statusClassName}>{statusText}</p>
              ) : null}
            </>
          )}
        </form>
      </div>
    </PublicShell>
  );
}
