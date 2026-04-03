import { getPublishedPostsByType } from "@/lib/data/posts"
import { buildPostsRssXml, buildRssResponse } from "@/lib/seo/rss"

export const dynamic = "force-dynamic"

export async function GET() {
  const notes = await getPublishedPostsByType("NOTE")

  const xml = buildPostsRssXml({
    title: "xistoh.log — Notes RSS",
    description: "Published notes, seeds, and experiments from xistoh.log.",
    path: "/notes",
    posts: notes,
  })

  return buildRssResponse(xml)
}
