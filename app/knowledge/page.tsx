import type { Metadata } from "next"

import { PostCard } from "@/components/site/post-card"
import { SiteHeader } from "@/components/site/site-header"
import { getPublishedKnowledgePosts } from "@/lib/data/posts"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Knowledge | xistoh.log",
  description: "Unified notes and projects index for xistoh.log.",
  alternates: {
    canonical: "/knowledge",
  },
}

export default async function KnowledgePage() {
  const posts = await getPublishedKnowledgePosts()

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl space-y-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#D4FF00]">Knowledge</p>
          <h1 className="text-4xl font-semibold text-white">Unified notes and projects</h1>
          <p className="text-base leading-7 text-zinc-400">
            `/knowledge` is the primary surface. `/notes` and `/projects` stay as filtered index views over the same published post model.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  )
}
