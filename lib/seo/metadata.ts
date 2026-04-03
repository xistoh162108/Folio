import type { Metadata } from "next"

import type { PostDetailDTO } from "@/lib/contracts/posts"

export const SITE_NAME = "xistoh.log"
export const SITE_URL = "https://xistoh.com"
export const DEFAULT_OG_IMAGE_PATH = "/placeholder-logo.png"
export const CANONICAL_AUTHOR_NAME = "Jimin Park"

function buildAbsoluteUrl(path: string) {
  if (path === "/") {
    return SITE_URL
  }

  return new URL(path, SITE_URL).toString()
}

function buildMetadataTitle(title?: string | null) {
  return title?.trim() ? `${title.trim()} | ${SITE_NAME}` : SITE_NAME
}

function buildMetadataImages(images: Array<string | null | undefined> = []) {
  const entries = [...images, DEFAULT_OG_IMAGE_PATH]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())

  return [...new Set(entries)]
}

function resolvePostImage(post: PostDetailDTO) {
  return post.coverImageUrl ?? post.assets.find((asset) => asset.kind === "IMAGE")?.url ?? null
}

export function buildPublicMetadata({
  title,
  description,
  path,
  rssPath,
  noIndex = false,
  images,
}: {
  title?: string | null
  description: string
  path: string
  rssPath?: string
  noIndex?: boolean
  images?: Array<string | null | undefined>
}): Metadata {
  const fullTitle = buildMetadataTitle(title)
  const canonical = buildAbsoluteUrl(path)
  const rss = rssPath ? buildAbsoluteUrl(rssPath) : null
  const resolvedImages = buildMetadataImages(images)

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical,
      types: rss
        ? {
            "application/rss+xml": rss,
          }
        : undefined,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: resolvedImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: resolvedImages,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  }
}

export function buildArticleMetadata({
  title,
  description,
  path,
  publishedTime,
  modifiedTime,
  tags,
  images,
}: {
  title: string
  description: string
  path: string
  publishedTime: string
  modifiedTime: string
  tags: string[]
  images?: Array<string | null | undefined>
}): Metadata {
  const fullTitle = buildMetadataTitle(title)
  const canonical = buildAbsoluteUrl(path)
  const resolvedImages = buildMetadataImages(images)

  return {
    title: fullTitle,
    description,
    authors: [{ name: CANONICAL_AUTHOR_NAME }],
    keywords: tags,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: resolvedImages,
      publishedTime,
      modifiedTime,
      authors: [CANONICAL_AUTHOR_NAME],
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: resolvedImages,
    },
  }
}

export function buildAdminMetadata(title: string): Metadata {
  return {
    title: buildMetadataTitle(title),
    description: "Administrative interface for xistoh.log.",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  }
}

export function buildPostStructuredData(post: PostDetailDTO) {
  const description = post.excerpt?.trim() || `${post.title} on ${SITE_NAME}.`
  const publishedTime = post.publishedAt ?? post.updatedAt
  const modifiedTime = post.updatedAt
  const url = buildAbsoluteUrl(post.type === "NOTE" ? `/notes/${post.slug}` : `/projects/${post.slug}`)
  const image = resolvePostImage(post)

  if (post.type === "NOTE") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description,
      datePublished: publishedTime,
      dateModified: modifiedTime,
      author: {
        "@type": "Person",
        name: CANONICAL_AUTHOR_NAME,
      },
      mainEntityOfPage: url,
      url,
      image: image ? [image] : undefined,
      keywords: post.tags,
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: post.title,
    headline: post.title,
    description,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    author: {
      "@type": "Person",
      name: CANONICAL_AUTHOR_NAME,
    },
    url,
    image: image ? [image] : undefined,
    keywords: post.tags,
  }
}

export function getPostSeoDescription(post: PostDetailDTO) {
  return post.excerpt?.trim() || `${post.title} on ${SITE_NAME}.`
}

export function getPostSeoImages(post: PostDetailDTO) {
  return [resolvePostImage(post)]
}
