import { PostCard } from "@/components/site/post-card"
import { SiteHeader } from "@/components/site/site-header"
import { getPublishedPostsByType } from "@/lib/data/posts"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  const posts = await getPublishedPostsByType("PROJECT")

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Projects</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Published projects</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            Projects share the same post model but render through their own route segment and card/detail DTOs.
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
