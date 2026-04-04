import type { PostCardDTO, PostDetailDTO } from "@/lib/contracts/posts"

import { getStatusSymbol } from "@/components/v0/fixtures"

export interface V0LiveNoteRow {
  id: string
  href: string
  title: string
  date: string
  tags: string[]
  filterTags: string[]
  views: number
  statusSymbol: string
}

export function formatPostDate(publishedAt: string | null, updatedAt?: string) {
  return (publishedAt ?? updatedAt ?? "").slice(0, 10)
}

export function formatV0Tag(tag: string) {
  if (tag.startsWith("#")) return tag
  return `#${tag.replace(/\s+/g, "")}`
}

export function getPostStatusSymbol() {
  return getStatusSymbol("seedling")
}

export function mapPostCardToNoteRow(post: PostCardDTO): V0LiveNoteRow {
  const formattedTags = post.tags.map(formatV0Tag)
  return {
    id: post.id,
    href: post.type === "PROJECT" ? `/projects/${post.slug}` : `/notes/${post.slug}`,
    title: post.title,
    date: formatPostDate(post.publishedAt, post.updatedAt),
    tags: formattedTags,
    filterTags: formattedTags,
    views: post.views,
    statusSymbol: getPostStatusSymbol(),
  }
}

export function estimateReadTimeFromHtml(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  const wordCount = text.length > 0 ? text.split(" ").length : 0
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`
}

export function formatDetailMeta(post: PostDetailDTO) {
  return {
    date: formatPostDate(post.publishedAt, post.updatedAt),
    readTime: estimateReadTimeFromHtml(post.htmlContent),
    tags: post.tags.map(formatV0Tag),
  }
}

export function formatDetailMetaLine(post: PostDetailDTO) {
  const meta = formatDetailMeta(post)
  return `// ${meta.date} - ${meta.readTime}`
}

export function formatLogTimestamp(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
