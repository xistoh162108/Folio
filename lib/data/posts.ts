import "server-only"

import { Prisma } from "@prisma/client"
import { notFound } from "next/navigation"
import { cache } from "react"

import { deriveMarkdownSource } from "@/lib/content/markdown-blocks"
import { inferLinkType } from "@/lib/content/link-preview"
import { collectBlockDocumentResources, resolvePostContentMode } from "@/lib/content/post-content"
import { parsePreviewMetadata } from "@/lib/content/preview-metadata"
import type { PaginatedCollectionStateDTO, PostCommentDTO } from "@/lib/contracts/community"
import type { PostAssetDTO, PostCardDTO, PostDetailDTO, PostEditorInput, PostKind, PostLinkDTO } from "@/lib/contracts/posts"
import {
  type AdminPostsQuery,
  type AdminPostsQueryInput,
  normalizeAdminPostsQuery,
} from "@/lib/data/admin-posts-query"
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

export interface PublicTagFilterOption {
  label: string
  value: string
}

export interface PublicPostsQuery {
  q: string
  tag: string | null
  page: number
  pageSize: number
}

export interface PublicPostsResult {
  posts: PostCardDTO[]
  tags: PublicTagFilterOption[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  query: PublicPostsQuery
}

export interface PublicPostsQueryInput {
  q?: string | null
  tag?: string | null
  page?: string | number | null
  pageSize?: number | null
}

const DEFAULT_PUBLIC_POSTS_PAGE_SIZE = 5

function normalizePublicTagValue(value?: string | null) {
  if (!value?.trim()) {
    return null
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "")
}

export function normalizePublicPostsQuery(input: PublicPostsQueryInput = {}): PublicPostsQuery {
  const pageValue =
    typeof input.page === "number"
      ? input.page
      : typeof input.page === "string"
        ? Number.parseInt(input.page, 10)
        : 1

  return {
    q: input.q?.trim() ?? "",
    tag: normalizePublicTagValue(input.tag),
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize: input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PUBLIC_POSTS_PAGE_SIZE,
  }
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

export interface PostCommentsQueryInput {
  page?: string | number | null
  pageSize?: number | null
}

export interface PaginatedPostCommentsResult {
  comments: PostCommentDTO[]
  pagination: PaginatedCollectionStateDTO
}

const DEFAULT_POST_COMMENTS_PAGE_SIZE = 20

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

function normalizePostCommentsQuery(input: PostCommentsQueryInput = {}) {
  const pageValue =
    typeof input.page === "number"
      ? input.page
      : typeof input.page === "string"
        ? Number.parseInt(input.page, 10)
        : 1

  return {
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize: input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_POST_COMMENTS_PAGE_SIZE,
  }
}

export async function getPostCommentsPage(postId: string, input: PostCommentsQueryInput = {}): Promise<PaginatedPostCommentsResult> {
  const query = normalizePostCommentsQuery(input)

  try {
    const total = await prisma.postComment.count({
      where: {
        postId,
        deletedAt: null,
      },
    })
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const page = Math.min(query.page, totalPages)
    const comments = await prisma.postComment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        message: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return {
      comments: mapComments(comments),
      pagination: {
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
      },
    }
  } catch (error) {
    if (isMissingTableError(error, "PostComment")) {
      return {
        comments: [],
        pagination: {
          page: 1,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      }
    }

    throw error
  }
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
  comments: PostCommentDTO[]
  commentsPagination: PaginatedCollectionStateDTO
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
    comments: post.comments,
    commentsPagination: post.commentsPagination,
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

export async function getPublicPosts(type: PostKind, input: PublicPostsQueryInput = {}): Promise<PublicPostsResult> {
  const query = normalizePublicPostsQuery(input)
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    type,
  }

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { slug: { contains: query.q, mode: "insensitive" } },
      { excerpt: { contains: query.q, mode: "insensitive" } },
      {
        tags: {
          some: {
            name: { contains: query.q, mode: "insensitive" },
          },
        },
      },
    ]
  }

  if (query.tag) {
    where.tags = {
      some: {
        normalizedName: query.tag,
      },
    }
  }

  const [total, posts, tags] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
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
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.tag.findMany({
      where: {
        posts: {
          some: {
            status: "PUBLISHED",
            type,
          },
        },
      },
      select: {
        name: true,
        normalizedName: true,
      },
      orderBy: [{ normalizedName: "asc" }],
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, totalPages)
  const pagedPosts =
    page === query.page
      ? posts
      : await prisma.post.findMany({
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
    posts: pagedPosts.map(mapPostCard),
    tags: tags.map((tag) => ({
      label: tag.name,
      value: tag.normalizedName,
    })),
    pagination: {
      page,
      pageSize: query.pageSize,
      total,
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

  const commentsResult = await getPostCommentsPage(post.id)

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
    comments: commentsResult.comments,
    commentsPagination: commentsResult.pagination,
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
