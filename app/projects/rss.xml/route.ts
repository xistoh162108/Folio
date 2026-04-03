import { getPublishedPostsByType } from "@/lib/data/posts"
import { buildPostsRssXml, buildRssResponse } from "@/lib/seo/rss"

export const dynamic = "force-dynamic"

export async function GET() {
  const projects = await getPublishedPostsByType("PROJECT")

  const xml = buildPostsRssXml({
    title: "xistoh.log — Projects RSS",
    description: "Selected projects, builds, and shipped work from xistoh.log.",
    path: "/projects",
    posts: projects,
  })

  return buildRssResponse(xml)
}
