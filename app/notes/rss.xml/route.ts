import { getPublishedPostsByType } from "@/lib/data/posts"
import { buildPostRssFeed } from "@/lib/feeds/rss"

export const dynamic = "force-dynamic"

export async function GET() {
  const notes = await getPublishedPostsByType("NOTE")
  const xml = buildPostRssFeed({
    title: "Notes Feed",
    description: "Published notes, seeds, and experiments from xistoh.log.",
    path: "/notes/rss.xml",
    type: "NOTE",
    items: notes,
  })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
