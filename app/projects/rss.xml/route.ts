import { getPublishedPostsByType } from "@/lib/data/posts"
import { buildPostRssFeed } from "@/lib/feeds/rss"

export const dynamic = "force-dynamic"

export async function GET() {
  const projects = await getPublishedPostsByType("PROJECT")
  const xml = buildPostRssFeed({
    title: "Projects Feed",
    description: "Published projects and shipped builds from xistoh.log.",
    path: "/projects/rss.xml",
    type: "PROJECT",
    items: projects,
  })

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
