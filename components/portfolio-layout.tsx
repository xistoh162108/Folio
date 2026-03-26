import type { PostCardDTO } from "@/lib/contracts/posts"

/**
 * Legacy export retained only to keep older imports type-safe while the app
 * moves to route-based pages. The production UI no longer uses this component.
 */
export function PortfolioInteractiveLayout({ initialPosts }: { initialPosts: PostCardDTO[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-6 text-sm text-zinc-400">
      Legacy portfolio shell disabled. Use the dedicated route-based pages instead.
      <p className="mt-2">{initialPosts.length} posts available.</p>
    </div>
  )
}
