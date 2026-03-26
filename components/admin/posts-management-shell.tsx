import Link from "next/link"

import type { AdminPostsResult } from "@/lib/data/posts"

type AdminPostsManagementShellProps = {
  basePath: "/admin/posts"
  title: string
  eyebrow: string
  description: string
  data: AdminPostsResult
  onCreateDraft: () => Promise<void>
}

function makeHref(basePath: AdminPostsManagementShellProps["basePath"], query: AdminPostsResult["query"], page: number) {
  const params = new URLSearchParams()

  if (query.q) {
    params.set("q", query.q)
  }

  if (query.status !== "ALL") {
    params.set("status", query.status)
  }

  if (query.type !== "ALL") {
    params.set("type", query.type)
  }

  if (page > 1) {
    params.set("page", String(page))
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function statusBadgeClass(status: AdminPostsResult["posts"][number]["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
    case "ARCHIVED":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-200"
  }
}

function typeBadgeClass(type: AdminPostsResult["posts"][number]["type"]) {
  return type === "PROJECT"
    ? "border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[#D4FF00]"
    : "border-sky-500/30 bg-sky-500/10 text-sky-200"
}

export function AdminPostsManagementShell({
  basePath,
  title,
  eyebrow,
  description,
  data,
  onCreateDraft,
}: AdminPostsManagementShellProps) {
  const { counts, pagination, query, posts } = data
  const rangeStart = counts.filtered === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const rangeEnd = counts.filtered === 0 ? 0 : Math.min(counts.filtered, pagination.page * pagination.pageSize)

  const pageWindowStart = Math.max(1, pagination.page - 2)
  const pageWindowEnd = Math.min(pagination.totalPages, pagination.page + 2)
  const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_, index) => pageWindowStart + index)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
          <h2 className="text-3xl font-semibold text-white">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
        </div>
        <form action={onCreateDraft}>
          <button className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black">
            Create draft
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">All posts</p>
          <p className="mt-3 text-3xl font-semibold text-white">{counts.total}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Draft</p>
          <p className="mt-3 text-3xl font-semibold text-white">{counts.draft}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Published</p>
          <p className="mt-3 text-3xl font-semibold text-white">{counts.published}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Archived</p>
          <p className="mt-3 text-3xl font-semibold text-white">{counts.archived}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Matching</p>
          <p className="mt-3 text-3xl font-semibold text-white">{counts.filtered}</p>
        </div>
      </div>

      <form method="get" className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.8fr_auto]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Search</span>
            <input
              name="q"
              defaultValue={query.q}
              placeholder="Title, slug, or excerpt"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</span>
            <select
              name="status"
              defaultValue={query.status}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
            >
              <option value="ALL">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Type</span>
            <select
              name="type"
              defaultValue={query.type}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-[#D4FF00]/40"
            >
              <option value="ALL">All</option>
              <option value="NOTE">Note</option>
              <option value="PROJECT">Project</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="rounded-full border border-[#D4FF00]/40 px-4 py-3 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black"
            >
              Apply
            </button>
            <Link
              href={basePath}
              className="rounded-full border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:border-white/30 hover:text-white"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-sm text-zinc-400">
          <p>
            Showing {rangeStart}-{rangeEnd} of {counts.filtered}
          </p>
          <p>
            Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>

        {posts.length > 0 ? (
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-black/30">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Updated</th>
                <th className="px-5 py-4">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {posts.map((post) => (
                <tr key={post.id} className="text-sm text-zinc-300">
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <Link href={`${basePath}/${post.id}`} className="font-medium text-white transition hover:text-[#D4FF00]">
                        {post.title}
                      </Link>
                      <p className="text-xs text-zinc-500">/{post.slug}</p>
                      {post.tags.length > 0 ? <p className="text-xs text-zinc-400">{post.tags.join(", ")}</p> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em] ${typeBadgeClass(post.type)}`}>
                      {post.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.16em] ${statusBadgeClass(post.status)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">{new Date(post.updatedAt).toLocaleString()}</td>
                  <td className="px-5 py-4">{post.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-14 text-center">
            <p className="text-lg font-medium text-white">No posts matched this filter.</p>
            <p className="mt-2 text-sm text-zinc-500">Try clearing search criteria or create a new draft.</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-zinc-950/70 px-5 py-4">
          <p className="text-sm text-zinc-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={makeHref(basePath, query, Math.max(1, pagination.page - 1))}
              aria-disabled={pagination.page === 1}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                pagination.page === 1
                  ? "pointer-events-none border-white/5 text-zinc-600"
                  : "border-white/10 text-zinc-300 hover:border-[#D4FF00]/40 hover:text-[#D4FF00]"
              }`}
            >
              Previous
            </Link>
            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={makeHref(basePath, query, pageNumber)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  pageNumber === pagination.page
                    ? "border-[#D4FF00]/40 bg-[#D4FF00]/10 text-[#D4FF00]"
                    : "border-white/10 text-zinc-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
            <Link
              href={makeHref(basePath, query, Math.min(pagination.totalPages, pagination.page + 1))}
              aria-disabled={pagination.page === pagination.totalPages}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                pagination.page === pagination.totalPages
                  ? "pointer-events-none border-white/5 text-zinc-600"
                  : "border-white/10 text-zinc-300 hover:border-[#D4FF00]/40 hover:text-[#D4FF00]"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
