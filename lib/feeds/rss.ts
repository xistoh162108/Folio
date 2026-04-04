import type { PostCardDTO } from "@/lib/contracts/posts"
import { SITE_NAME, SITE_URL } from "@/lib/seo/metadata"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildItemUrl(type: "NOTE" | "PROJECT", slug: string) {
  return `${SITE_URL}/${type === "NOTE" ? "notes" : "projects"}/${slug}`
}

function buildFeedUrl(path: string) {
  return `${SITE_URL}${path}`
}

export function buildPostRssFeed(input: {
  title: string
  description: string
  path: "/notes/rss.xml" | "/projects/rss.xml"
  type: "NOTE" | "PROJECT"
  items: PostCardDTO[]
}) {
  const generatedAt = new Date().toUTCString()
  const feedUrl = buildFeedUrl(input.path)
  const siteUrl = input.type === "NOTE" ? `${SITE_URL}/notes` : `${SITE_URL}/projects`
  const itemsXml = input.items
    .map((item) => {
      const itemUrl = buildItemUrl(input.type, item.slug)
      const publishedAt = item.publishedAt ?? item.updatedAt
      const excerpt = item.excerpt?.trim()

      return `<item>
  <title>${escapeXml(item.title)}</title>
  <link>${itemUrl}</link>
  <guid>${itemUrl}</guid>
  <pubDate>${new Date(publishedAt).toUTCString()}</pubDate>
  ${excerpt ? `<description>${escapeXml(excerpt)}</description>` : ""}
  ${item.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n  ")}
</item>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(`${input.title} | ${SITE_NAME}`)}</title>
  <link>${siteUrl}</link>
  <description>${escapeXml(input.description)}</description>
  <language>en-US</language>
  <lastBuildDate>${generatedAt}</lastBuildDate>
  <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
  ${itemsXml}
</channel>
</rss>`
}
