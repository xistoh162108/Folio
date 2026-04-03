import type { PostCardDTO } from "@/lib/contracts/posts"

import { SITE_URL } from "@/lib/seo/metadata"

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function toRfc822(value: string | null, fallback: string) {
  const date = new Date(value ?? fallback)
  return Number.isNaN(date.getTime()) ? new Date(fallback).toUTCString() : date.toUTCString()
}

export function buildPostsRssXml({
  title,
  description,
  path,
  posts,
}: {
  title: string
  description: string
  path: "/notes" | "/projects"
  posts: PostCardDTO[]
}) {
  const feedUrl = `${SITE_URL}${path}/rss.xml`
  const sitePathUrl = `${SITE_URL}${path}`

  const items = posts
    .map((post) => {
      const postPath = `${path}/${post.slug}`
      const postUrl = `${SITE_URL}${postPath}`
      const summary = post.excerpt?.trim() || undefined
      const date = toRfc822(post.publishedAt, post.updatedAt)
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")

      return [
        "<item>",
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(postUrl)}</link>`,
        `<guid isPermaLink="true">${escapeXml(postUrl)}</guid>`,
        `<pubDate>${date}</pubDate>`,
        summary ? `<description>${escapeXml(summary)}</description>` : null,
        categories || null,
        "</item>",
      ]
        .filter(Boolean)
        .join("")
    })
    .join("")

  const lastBuildDate = posts[0] ? toRfc822(posts[0].publishedAt, posts[0].updatedAt) : new Date().toUTCString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(title)}</title>
<link>${escapeXml(sitePathUrl)}</link>
<description>${escapeXml(description)}</description>
<language>en-us</language>
<lastBuildDate>${lastBuildDate}</lastBuildDate>
<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`
}

export function buildRssResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  })
}
