"use client"

import Link from "next/link"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { AdminPostsResult } from "@/lib/data/posts"

interface ManagePostsScreenProps {
  data: AdminPostsResult
  basePath: "/admin/posts"
  onCreateDraft: () => Promise<void>
  isDarkMode?: boolean
  brandLabel?: string
}

type QueryOverride = Partial<AdminPostsResult["query"]>

function makeHref(basePath: ManagePostsScreenProps["basePath"], query: AdminPostsResult["query"], overrides: QueryOverride = {}) {
  const nextQuery = {
    ...query,
    ...overrides,
  }
  const params = new URLSearchParams()

  if (nextQuery.q) {
    params.set("q", nextQuery.q)
  }

  if (nextQuery.status !== "ALL") {
    params.set("status", nextQuery.status)
  }

  if (nextQuery.type !== "ALL") {
    params.set("type", nextQuery.type)
  }

  if ((nextQuery.page ?? 1) > 1) {
    params.set("page", String(nextQuery.page))
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function formatDate(value: string | null) {
  if (!value) {
    return "draft"
  }

  return new Date(value).toISOString().slice(0, 10)
}

export function ManagePostsScreen({
  data,
  basePath,
  onCreateDraft,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: ManagePostsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"
  const { counts, pagination, posts, query } = data
  const statusFilters = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const
  const typeFilters = ["ALL", "NOTE", "PROJECT"] as const

  return (
    <AdminShell
      currentSection="manage-posts"
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
    >
      <main className="flex-1 min-h-full p-4 sm:p-6 md:h-full md:overflow-y-auto">
        <div className="space-y-6 max-w-3xl">
          <div>
            <p className={`text-xs ${mutedText}`}>// manage posts</p>
            <h2 className="text-lg mt-1">All Content</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <form method="get" className="flex min-w-[16rem] flex-1 flex-wrap items-center gap-2">
              <span className={mutedText}>[search]</span>
              <input
                aria-label="Search"
                name="q"
                defaultValue={query.q}
                placeholder="title / slug / excerpt"
                className={`min-w-[12rem] flex-1 border-b ${borderColor} bg-transparent px-2 py-1 text-xs outline-none`}
              />
              {query.status !== "ALL" ? <input type="hidden" name="status" value={query.status} /> : null}
              {query.type !== "ALL" ? <input type="hidden" name="type" value={query.type} /> : null}
              <button type="submit" aria-label="Apply" className={`px-2 py-1 ${hoverBg}`}>
                [apply]
              </button>
              <Link href={basePath} aria-label="Clear search" className={`px-2 py-1 ${hoverBg}`}>
                [clear]
              </Link>
            </form>

            <form action={onCreateDraft}>
              <button className={`px-2 py-1 ${hoverBg}`}>[+] New Draft</button>
            </form>

            <span className={mutedText}>[status]</span>
            {statusFilters.map((status) => (
              <Link
                key={status}
                href={makeHref(basePath, query, { status, page: 1 })}
                aria-label={`Status ${status.toLowerCase()}`}
                className={`px-2 py-1 transition-colors ${query.status === status ? activeBg : hoverBg}`}
              >
                [{status.toLowerCase()}]
              </Link>
            ))}
            <span className={mutedText}>[type]</span>
            {typeFilters.map((type) => (
              <Link
                key={type}
                href={makeHref(basePath, query, { type, page: 1 })}
                aria-label={`Type ${type.toLowerCase()}`}
                className={`px-2 py-1 transition-colors ${query.type === type ? activeBg : hoverBg}`}
              >
                [{type.toLowerCase()}]
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            {posts.length === 0 ? (
              <div className={`border border-dashed ${borderColor} px-4 py-6 text-sm ${mutedText}`}>[ NO_MATCHING_POSTS ]</div>
            ) : null}

            {posts.map((post) => (
              <div
                key={post.id}
                className={`flex items-center gap-4 py-3 px-3 border ${borderColor} ${hoverBg} transition-colors`}
              >
                <span className={mutedText}>=</span>
                <span className={`text-xs ${mutedText} w-24 shrink-0`}>{formatDate(post.publishedAt)}</span>
                <span className="flex-1 text-sm truncate">{post.title}</span>
                <span className={`text-xs px-2 py-0.5 ${mutedText}`}>[{post.type === "PROJECT" ? "project" : "note"}]</span>
                <span
                  className={`text-xs px-2 py-0.5 ${
                    post.status === "PUBLISHED"
                      ? isDarkMode
                        ? "text-green-400"
                        : "text-green-600"
                      : post.status === "ARCHIVED"
                        ? mutedText
                        : isDarkMode
                          ? "text-amber-300"
                          : "text-amber-700"
                  }`}
                >
                  [{post.status.toLowerCase()}]
                </span>
                <div className="flex items-center gap-2 text-xs shrink-0">
                  <Link href={`${basePath}/${post.id}`} className={`px-2 py-1 ${hoverBg}`}>
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex flex-wrap items-center justify-between gap-3 border ${borderColor} px-3 py-2 text-xs`}>
            <div className={`flex flex-wrap items-center gap-3 ${mutedText}`}>
              <span>[total {counts.total}]</span>
              <span>[filtered {counts.filtered}]</span>
              <span>[status {query.status.toLowerCase()}]</span>
              <span>[type {query.type.toLowerCase()}]</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={mutedText}>
                [{pagination.page}/{pagination.totalPages}]
              </span>
              <Link
                href={makeHref(basePath, query, { page: Math.max(1, pagination.page - 1) })}
                aria-label="Prev"
                aria-disabled={pagination.page === 1}
                className={`px-2 py-1 border ${pagination.page === 1 ? `${borderColor} ${mutedText} pointer-events-none` : `${borderColor} ${hoverBg}`}`}
              >
                [&lt;]
              </Link>
              <Link
                href={makeHref(basePath, query, { page: Math.min(pagination.totalPages, pagination.page + 1) })}
                aria-label="Next"
                aria-disabled={pagination.page === pagination.totalPages}
                className={`px-2 py-1 border ${
                  pagination.page === pagination.totalPages ? `${borderColor} ${mutedText} pointer-events-none` : `${borderColor} ${hoverBg}`
                }`}
              >
                [&gt;]
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AdminShell>
  )
}
