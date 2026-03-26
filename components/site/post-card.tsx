import Link from "next/link"

import type { PostCardDTO } from "@/lib/contracts/posts"

export function PostCard({ post }: { post: PostCardDTO }) {
  const href = post.type === "PROJECT" ? `/projects/${post.slug}` : `/notes/${post.slug}`
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Draft"

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5 transition hover:border-[#D4FF00]/30">
      <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <span>{publishedLabel}</span>
        <span>{post.type === "PROJECT" ? "Project" : "Note"}</span>
        <span>{post.views} views</span>
      </div>
      <div className="mt-4 space-y-3">
        <Link href={href} className="block text-xl font-semibold text-white transition hover:text-[#D4FF00]">
          {post.title}
        </Link>
        {post.excerpt ? <p className="text-sm leading-6 text-zinc-400">{post.excerpt}</p> : null}
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
