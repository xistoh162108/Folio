import "server-only"

import { Prisma } from "@prisma/client"
import { notFound } from "next/navigation"
import { cache } from "react"

import { deriveMarkdownSource } from "@/lib/content/markdown-blocks"
import { inferLinkType } from "@/lib/content/link-preview"
import { collectBlockDocumentResources, resolvePostContentMode } from "@/lib/content/post-content"
import { parsePreviewMetadata } from "@/lib/content/preview-metadata"
import type { PostCommentDTO } from "@/lib/contracts/community"
import type { PostAssetDTO, PostCardDTO, PostDetailDTO, PostEditorInput, PostKind, PostLinkDTO } from "@/lib/contracts/posts"
import {
  type AdminPostsQuery,
  type AdminPostsQueryInput,
  normalizeAdminPostsQuery,
} from "@/lib/data/admin-posts-query"
import { type PublicNotesQuery, type PublicNotesQueryInput, normalizePublicNotesQuery } from "@/lib/data/public-notes-query"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

function mapLegacyLinks(post: {
  githubUrl: string | null
  demoUrl: string | null
  docsUrl: string | null
}): PostLinkDTO[] {
  return [
    post.githubUrl ? { label: "GitHub", url: post.githubUrl, type: "GITHUB" } : null,
    post.demoUrl ? { label: "Live Demo", url: post.demoUrl, type: "WEBSITE" } : null,
    post.docsUrl ? { label: "Docs", url: post.docsUrl, type: "DOCS" } : null,
  ].filter((item): item is PostLinkDTO => Boolean(item))
}

function mapPostCard(post: {
  id: string
  slug: string
  type: PostKind
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  title: string
  excerpt: string | null
  tags: { name: string }[]
  views: number
  coverImageUrl: string | null
  publishedAt: Date | null
  updatedAt: Date
}): PostCardDTO {
  return {
    id: post.id,
    slug: post.slug,
    type: post.type,
    status: post.status,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags.map((tag) => tag.name),
    views: post.views,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    updatedAt: post.updatedAt.toISOString(),
  }
}

export type PublishedProjectIndexItem = PostCardDTO & {
  links: Array<{
    label: string
    url: string
  }>
}

function mapProjectIndexEntry(post: {
  id: string
  slug: string
  type: PostKind
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  title: string
  excerpt: string | null
  tags: { name: string }[]
  views: number
  coverImageUrl: string | null
  publishedAt: Date | null
  updatedAt: Date
  githubUrl: string | null
  demoUrl: string | null
  docsUrl: string | null
}): PublishedProjectIndexItem {
  return {
    ...mapPostCard(post),
    links: mapLegacyLinks(post).map((link) => ({
      label: link.label,
      url: link.url,
    })),
  }
}

export type AdminPostsResult = {
  posts: PostCardDTO[]
  counts: {
    total: number
    draft: number
    published: number
    archived: number
    filtered: number
  }
  pagination: {
    page: number
    pageSize: number
    totalPages: number
  }
  query: AdminPostsQuery
}

export type PublicNotesResult = {
  notes: PostCardDTO[]
  counts: {
    total: number
    filtered: number
  }
  pagination: {
    page: number
    pageSize: number
    totalPages: number
  }
  query: PublicNotesQuery
}

function mapAssets(
  assets: {
    id: string
    kind: "IMAGE" | "FILE"
    originalName: string
    mime: string
    size: number
    publicUrl: string | null
    pendingDeleteAt: Date | null
    createdAt: Date
  }[],
): PostAssetDTO[] {
  return assets.map((asset) => ({
    id: asset.id,
    kind: asset.kind,
    originalName: asset.originalName,
    mime: asset.mime,
    size: asset.size,
    url: asset.kind === "IMAGE" ? asset.publicUrl ?? "" : `/api/files/${asset.id}`,
    createdAt: asset.createdAt.toISOString(),
    pendingDeleteAt: asset.pendingDeleteAt?.toISOString() ?? null,
  }))
}

type PostAssetRecord = {
  id: string
  kind: "IMAGE" | "FILE"
  originalName: string
  mime: string
  size: number
  publicUrl: string | null
  pendingDeleteAt: Date | null
  createdAt: Date
}

type PostLinkRecord = {
  id: string
  label: string | null
  url: string
  normalizedUrl: string
  type: "GITHUB" | "WEBSITE" | "YOUTUBE" | "DOCS" | "OTHER"
  sortOrder: number
}

type LinkPreviewRecord = {
  normalizedUrl: string
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  embedUrl: string | null
  previewStatus: "PENDING" | "READY" | "FAILED"
  metadata: Prisma.JsonValue | null
}

function mapComments(
  comments: Array<{
    id: string
    message: string
    userAgent: string | null
    createdAt: Date
  }>,
): PostCommentDTO[] {
  return comments.map((comment) => ({
    id: comment.id,
    message: comment.message,
    sourceLabel: toLogSourceLabel(comment.userAgent),
    createdAt: comment.createdAt.toISOString(),
  }))
}

function mapStoredLinks(links: PostLinkRecord[], previews: Map<string, LinkPreviewRecord>): PostLinkDTO[] {
  return links.map((link) => {
    const preview = previews.get(link.normalizedUrl)

    return {
      id: link.id,
      label: link.label?.trim() || preview?.title || preview?.siteName || link.url,
      url: link.url,
      type: link.type,
      normalizedUrl: link.normalizedUrl,
      siteName: preview?.siteName ?? null,
      title: preview?.title ?? null,
      description: preview?.description ?? null,
      imageUrl: preview?.imageUrl ?? null,
      embedUrl: preview?.embedUrl ?? null,
      previewStatus: preview?.previewStatus ?? "PENDING",
      metadata: parsePreviewMetadata(preview?.metadata),
    }
  })
}

function buildPreviewBackedLink(normalizedUrl: string, preview?: LinkPreviewRecord | null): PostLinkDTO {
  return {
    label: preview?.title ?? preview?.siteName ?? normalizedUrl,
    url: normalizedUrl,
    type: inferLinkType(normalizedUrl),
    normalizedUrl,
    siteName: preview?.siteName ?? null,
    title: preview?.title ?? null,
    description: preview?.description ?? null,
    imageUrl: preview?.imageUrl ?? null,
    embedUrl: preview?.embedUrl ?? null,
    previewStatus: preview?.previewStatus ?? "PENDING",
    metadata: parsePreviewMetadata(preview?.metadata),
  }
}

function mergeDetailLinks(input: {
  content: unknown
  post: {
    githubUrl: string | null
    demoUrl: string | null
    docsUrl: string | null
  }
  storedLinks: PostLinkRecord[]
  previews: Map<string, LinkPreviewRecord>
}) {
  const mappedLinks = input.storedLinks.length > 0 ? mapStoredLinks(input.storedLinks, input.previews) : mapLegacyLinks(input.post)
  const seen = new Set(
    mappedLinks
      .map((link) => link.normalizedUrl ?? link.url)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  )

  for (const normalizedUrl of collectBlockDocumentResources(input.content).linkUrls) {
    if (seen.has(normalizedUrl)) {
      continue
    }

    mappedLinks.push(buildPreviewBackedLink(normalizedUrl, input.previews.get(normalizedUrl)))
    seen.add(normalizedUrl)
  }

  return mappedLinks
}

function mapPostDetail(post: {
  id: string
  slug: string
  type: PostKind
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  title: string
  excerpt: string | null
  tags: { name: string }[]
  views: number
  coverImageUrl: string | null
  publishedAt: Date | null
  updatedAt: Date
  contentVersion: number
  markdownSource: string | null
  htmlContent: string
  content: unknown
  githubUrl: string | null
  demoUrl: string | null
  docsUrl: string | null
  assets: {
    id: string
    kind: "IMAGE" | "FILE"
    originalName: string
    mime: string
    size: number
    publicUrl: string | null
    pendingDeleteAt: Date | null
    createdAt: Date
  }[]
  links: PostLinkDTO[]
  likeCount: number
  comments: Array<{
    id: string
    message: string
    userAgent: string | null
    createdAt: Date
  }>
}): PostDetailDTO {
  return {
    ...mapPostCard(post),
    contentVersion: post.contentVersion,
    contentMode: resolvePostContentMode({
      contentVersion: post.contentVersion,
      markdownSource: post.markdownSource,
      content: post.content,
    }),
    markdownSource: post.markdownSource,
    htmlContent: post.htmlContent,
    content: post.content,
    links: post.links,
    assets: mapAssets(post.assets),
    likeCount: post.likeCount,
    comments: mapComments(post.comments),
  }
}

export async function getHomepagePosts() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 8,
  })

  const cards = posts.map(mapPostCard)

  return {
    notes: cards.filter((post) => post.type === "NOTE"),
    projects: cards.filter((post) => post.type === "PROJECT"),
  }
}

export async function getPublishedPostsByType(type: PostKind) {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      type,
    },
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  })

  return posts.map(mapPostCard)
}

export async function getPublishedNotes(input: PublicNotesQueryInput = {}, allowedTags: readonly string[]): Promise<PublicNotesResult> {
  const query = normalizePublicNotesQuery(input, allowedTags)
  const selectedTag = query.tag === "All" ? null : query.tag.replace(/^#/, "")
  const where = {
    status: "PUBLISHED" as const,
    type: "NOTE" as const,
    ...(selectedTag
      ? {
          tags: {
            some: {
              name: {
                equals: selectedTag,
                mode: "insensitive" as const,
              },
            },
          },
        }
      : {}),
  }

  const [total, filtered] = await Promise.all([
    prisma.post.count({
      where: {
        status: "PUBLISHED",
        type: "NOTE",
      },
    }),
    prisma.post.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(filtered / query.pageSize))
  const page = Math.min(query.page, totalPages)

  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
  })

  return {
    notes: posts.map(mapPostCard),
    counts: {
      total,
      filtered,
    },
    pagination: {
      page,
      pageSize: query.pageSize,
      totalPages,
    },
    query: {
      ...query,
      page,
    },
  }
}

export async function getPublishedProjectIndexItems() {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      type: "PROJECT",
    },
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
      githubUrl: true,
      demoUrl: true,
      docsUrl: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  })

  return posts.map(mapProjectIndexEntry)
}

const getPublishedPostDetailCached = cache(async (type: PostKind, slug: string) => {
  const post = await prisma.post.findFirst({
    where: {
      type,
      slug,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
      _count: {
        select: {
          likes: true,
        },
      },
      contentVersion: true,
      markdownSource: true,
      htmlContent: true,
      content: true,
      githubUrl: true,
      demoUrl: true,
      docsUrl: true,
    },
  })

  if (!post) {
    notFound()
  }

  let assets: PostAssetRecord[] = []
  try {
    assets = await prisma.postAsset.findMany({
      where: { postId: post.id, pendingDeleteAt: null },
      select: {
        id: true,
        kind: true,
        originalName: true,
        mime: true,
        size: true,
        publicUrl: true,
        pendingDeleteAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })
  } catch (error) {
    if (!isMissingTableError(error, "PostAsset")) {
      throw error
    }
  }

  let storedLinks: PostLinkRecord[] = []
  try {
    storedLinks = await prisma.postLink.findMany({
      where: { postId: post.id },
      select: {
        id: true,
        label: true,
        url: true,
        normalizedUrl: true,
        type: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  } catch (error) {
    if (!isMissingTableError(error, "PostLink")) {
      throw error
    }
  }

  let previewMap = new Map<string, LinkPreviewRecord>()

  const blockResources = collectBlockDocumentResources(post.content)
  const previewUrls = new Set([...storedLinks.map((link) => link.normalizedUrl), ...blockResources.linkUrls])

  if (previewUrls.size > 0) {
    try {
      const previews = await prisma.linkPreviewCache.findMany({
        where: {
          normalizedUrl: {
            in: [...previewUrls],
          },
        },
        select: {
          normalizedUrl: true,
          title: true,
          description: true,
          imageUrl: true,
          siteName: true,
          embedUrl: true,
          previewStatus: true,
          metadata: true,
        },
      })

      previewMap = new Map(previews.map((preview) => [preview.normalizedUrl, preview]))
    } catch (error) {
      if (!isMissingTableError(error, "LinkPreviewCache")) {
        throw error
      }
    }
  }

  return mapPostDetail({
    ...post,
    assets,
    links: mergeDetailLinks({
      content: post.content,
      post,
      storedLinks,
      previews: previewMap,
    }),
    likeCount: post._count.likes,
    comments: await prisma.postComment.findMany({
      where: {
        postId: post.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        message: true,
        userAgent: true,
        createdAt: true,
      },
    }).catch((error) => {
      if (isMissingTableError(error, "PostComment")) {
        return []
      }

      throw error
    }),
  })
})

export async function getPublishedPostDetail(type: PostKind, slug: string) {
  return getPublishedPostDetailCached(type, slug)
}

export async function getAdminPosts(input: AdminPostsQueryInput = {}): Promise<AdminPostsResult> {
  const query = normalizeAdminPostsQuery(input)
  const searchWhere: Prisma.PostWhereInput = {}

  if (query.q) {
    searchWhere.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q, mode: "insensitive" } },
      { excerpt: { contains: query.q, mode: "insensitive" } },
    ]
  }

  if (query.status !== "ALL") {
    searchWhere.status = query.status
  }

  if (query.type !== "ALL") {
    searchWhere.type = query.type
  }

  const [total, draft, published, archived, filtered] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "ARCHIVED" } }),
    prisma.post.count({ where: searchWhere }),
  ])

  const totalPages = Math.max(1, Math.ceil(filtered / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const posts = await prisma.post.findMany({
    where: searchWhere,
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      tags: {
        select: { name: true },
      },
      views: true,
      coverImageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
  })

  return {
    posts: posts.map(mapPostCard),
    counts: {
      total,
      draft,
      published,
      archived,
      filtered,
    },
    pagination: {
      page,
      pageSize: query.pageSize,
      totalPages,
    },
    query: {
      ...query,
      page,
    },
  }
}

export async function getAdminPostEditorState(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      type: true,
      status: true,
      title: true,
      excerpt: true,
      contentVersion: true,
      markdownSource: true,
      htmlContent: true,
      content: true,
      coverImageUrl: true,
      githubUrl: true,
      demoUrl: true,
      docsUrl: true,
      tags: {
        select: { name: true },
      },
    },
  })

  if (!post) {
    notFound()
  }

  let assets: PostAssetRecord[] = []
  try {
    assets = await prisma.postAsset.findMany({
      where: { postId: post.id },
      select: {
        id: true,
        kind: true,
        originalName: true,
        mime: true,
        size: true,
        publicUrl: true,
        pendingDeleteAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })
  } catch (error) {
    if (!isMissingTableError(error, "PostAsset")) {
      throw error
    }
  }

  let storedLinks: PostLinkRecord[] = []
  try {
    storedLinks = await prisma.postLink.findMany({
      where: { postId: post.id },
      select: {
        id: true,
        label: true,
        url: true,
        normalizedUrl: true,
        type: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })
  } catch (error) {
    if (!isMissingTableError(error, "PostLink")) {
      throw error
    }
  }

  let previewMap = new Map<string, LinkPreviewRecord>()

  if (storedLinks.length > 0) {
    try {
      const previews = await prisma.linkPreviewCache.findMany({
        where: {
          normalizedUrl: {
            in: storedLinks.map((link) => link.normalizedUrl),
          },
        },
        select: {
          normalizedUrl: true,
          title: true,
          description: true,
          imageUrl: true,
          siteName: true,
          embedUrl: true,
          previewStatus: true,
          metadata: true,
        },
      })

      previewMap = new Map(previews.map((preview) => [preview.normalizedUrl, preview]))
    } catch (error) {
      if (!isMissingTableError(error, "LinkPreviewCache")) {
        throw error
      }
    }
  }

  const editorInput: PostEditorInput = {
    id: post.id,
    slug: post.slug,
    type: post.type,
    status: post.status,
    title: post.title,
    excerpt: post.excerpt ?? "",
    contentVersion: post.contentVersion,
    contentMode: resolvePostContentMode({
      contentVersion: post.contentVersion,
      markdownSource: post.markdownSource,
      content: post.content,
    }),
    markdownSource: deriveMarkdownSource({
      markdownSource: post.markdownSource,
      content: post.content,
      htmlContent: post.htmlContent,
      excerpt: post.excerpt,
      title: post.title,
    }),
    htmlContent: post.htmlContent,
    content: post.content,
    tags: post.tags.map((tag) => tag.name),
    coverImageUrl: post.coverImageUrl ?? "",
    githubUrl: post.githubUrl ?? "",
    demoUrl: post.demoUrl ?? "",
    docsUrl: post.docsUrl ?? "",
    assets: mapAssets(assets),
    links: storedLinks.length > 0 ? mapStoredLinks(storedLinks, previewMap) : mapLegacyLinks(post),
  }

  return editorInput
}
