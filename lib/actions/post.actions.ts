"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { prisma } from "../db/prisma"
import { z } from "zod"

import { buildMarkdownWriterPayload } from "@/lib/content/markdown-blocks"
import { buildLegacyContentDocument } from "@/lib/content/post-content"
import { isEffectivelyEmptyDraft } from "@/lib/content/draft-state"
import { fetchLinkPreview, inferLinkType, normalizeExternalUrl, toPostLinkDTO } from "@/lib/content/link-preview"
import { requireUser } from "@/lib/auth"
import { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"
import type { PostEditorInput, PostLinkDTO, PostLinkType, PreviewMetadata } from "@/lib/contracts/posts"
import { isMissingTableError } from "@/lib/db/errors"
import { slugify } from "@/lib/utils/normalizers"
import { kickWorkerRoute } from "@/lib/workers/dispatch"

const PostSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  excerpt: z.string().optional().default(""),
  content: z.any().optional(),
  htmlContent: z.string().default(""),
  markdownSource: z.string().optional().default(""),
  contentMode: z.enum(["legacy", "block"]).optional().default("legacy"),
  type: z.enum(["NOTE", "PROJECT"]).default("NOTE"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  tags: z.array(z.string()).default([]),
  coverImageUrl: z.string().optional().default(""),
  githubUrl: z.string().optional().default(""),
  demoUrl: z.string().optional().default(""),
  docsUrl: z.string().optional().default(""),
  assets: z
    .array(
      z
        .object({
          id: z.string().optional(),
        })
        .passthrough(),
    )
    .default([]),
  links: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().optional().default(""),
        url: z.string().trim().min(1, "Link URL is required"),
        type: z.enum(["GITHUB", "WEBSITE", "YOUTUBE", "DOCS", "OTHER"]).optional(),
      }),
    )
    .default([]),
})

type PostActionResult =
  | { success: true; id: string }
  | { success: false; error: string }
type PreparedLink = {
  label: string
  url: string
  normalizedUrl: string
  type: PostLinkType
  sortOrder: number
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  embedUrl: string | null
  previewStatus: "PENDING" | "READY" | "FAILED"
  failureReason: string | null
  metadata: PreviewMetadata | null
}

function resolveCoverFromAssets(
  requestedCoverImageUrl: string,
  assets: Array<Record<string, unknown>>,
): string | null {
  const normalizedRequested = requestedCoverImageUrl.trim()
  if (!normalizedRequested) {
    return null
  }

  const imageAssetUrls = new Set(
    assets.flatMap((asset) => {
      const kind = typeof asset.kind === "string" ? asset.kind : null
      const url = typeof asset.url === "string" ? asset.url : null
      if (kind !== "IMAGE" || !url || url.trim().length === 0) {
        return []
      }

      return [url.trim()]
    }),
  )

  if (!imageAssetUrls.has(normalizedRequested)) {
    throw new Error("Cover image must be selected from this post's uploaded images.")
  }

  return normalizedRequested
}

async function connectTags(tx: Prisma.TransactionClient, tags: string[]) {
  const normalized = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]

  const records = await Promise.all(
    normalized.map((tag) =>
      tx.tag.upsert({
        where: { normalizedName: slugify(tag) },
        update: { name: tag },
        create: {
          name: tag,
          normalizedName: slugify(tag),
        },
      }),
    ),
  )

  return records.map((tag) => ({ id: tag.id }))
}

function mergeLinks(input: {
  links: Array<Pick<PostLinkDTO, "label" | "url"> & { type?: PostLinkType }>
  githubUrl?: string
  demoUrl?: string
  docsUrl?: string
}) {
  const candidates: Array<Pick<PostLinkDTO, "label" | "url"> & { type?: PostLinkType }> = [
    ...input.links,
    input.githubUrl ? { label: "GitHub", url: input.githubUrl, type: "GITHUB" } : null,
    input.demoUrl ? { label: "Live Demo", url: input.demoUrl, type: "WEBSITE" } : null,
    input.docsUrl ? { label: "Docs", url: input.docsUrl, type: "DOCS" } : null,
  ].filter((item): item is Pick<PostLinkDTO, "label" | "url" | "type"> => Boolean(item))

  const seen = new Set<string>()
  const result: Array<Pick<PostLinkDTO, "label" | "url"> & { type?: PostLinkType }> = []

  for (const item of candidates) {
    const normalizedUrl = normalizeExternalUrl(item.url)
    if (seen.has(normalizedUrl)) {
      continue
    }

    seen.add(normalizedUrl)
    result.push(item)
  }

  return result
}

async function prepareLinks(
  links: Array<Pick<PostLinkDTO, "label" | "url"> & { type?: PostLinkType }>,
): Promise<PreparedLink[]> {
  const prepared = await Promise.all(
    links.map(async (link, index) => {
      const preview = await fetchLinkPreview(link.url)
      const dto = toPostLinkDTO({
        ...preview,
        label: link.label,
      })

      return {
        label: dto.label,
        url: preview.url,
        normalizedUrl: preview.normalizedUrl,
        type: link.type ?? preview.type ?? inferLinkType(preview.url),
        sortOrder: index,
        title: dto.title ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        siteName: dto.siteName ?? null,
        embedUrl: dto.embedUrl ?? null,
        previewStatus: dto.previewStatus ?? "FAILED",
        failureReason: preview.failureReason,
        metadata: dto.metadata ?? null,
      } satisfies PreparedLink
    }),
  )

  return prepared
}

async function syncPostLinks(tx: Prisma.TransactionClient, postId: string, links: PreparedLink[]) {
  try {
    await tx.postLink.deleteMany({
      where: { postId },
    })

    for (const link of links) {
      await tx.linkPreviewCache.upsert({
        where: { normalizedUrl: link.normalizedUrl },
        update: {
          url: link.url,
          title: link.title,
          description: link.description,
          imageUrl: link.imageUrl,
          siteName: link.siteName,
          embedUrl: link.embedUrl,
          metadata: link.metadata ? (link.metadata as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          previewStatus: link.previewStatus,
          failureReason: link.failureReason,
          lastFetchedAt: new Date(),
        },
        create: {
          url: link.url,
          normalizedUrl: link.normalizedUrl,
          title: link.title,
          description: link.description,
          imageUrl: link.imageUrl,
          siteName: link.siteName,
          embedUrl: link.embedUrl,
          metadata: link.metadata ? (link.metadata as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          previewStatus: link.previewStatus,
          failureReason: link.failureReason,
          lastFetchedAt: new Date(),
        },
      })
    }

    if (links.length > 0) {
      await tx.postLink.createMany({
        data: links.map((link) => ({
          postId,
          label: link.label,
          url: link.url,
          normalizedUrl: link.normalizedUrl,
          type: link.type,
          sortOrder: link.sortOrder,
        })),
      })
    }
  } catch (error) {
    if (isMissingTableError(error, "PostLink") || isMissingTableError(error, "LinkPreviewCache")) {
      return
    }

    throw error
  }
}

async function syncPostAssets(
  tx: Prisma.TransactionClient,
  input: {
    postId: string
    keepAssetIds: string[]
    coverImageUrl: string | null
    isEmptyDraft: boolean
  },
) {
  try {
    const existingAssets = await tx.postAsset.findMany({
      where: { postId: input.postId },
      select: {
        id: true,
        publicUrl: true,
      },
    })

    const keepSet = new Set(input.keepAssetIds)
    const removedAssets = existingAssets.filter((asset) => !keepSet.has(asset.id))
    let nextCoverImageUrl = input.coverImageUrl

    if (
      nextCoverImageUrl &&
      removedAssets.some((asset) => asset.publicUrl && asset.publicUrl === nextCoverImageUrl)
    ) {
      nextCoverImageUrl = null
    }

    if (removedAssets.length > 0) {
      await tx.postAsset.updateMany({
        where: {
          id: {
            in: removedAssets.map((asset) => asset.id),
          },
        },
        data: {
          pendingDeleteAt: new Date(),
          deleteAttempts: 0,
          lastDeleteError: null,
        },
      })
    }

    if (!input.isEmptyDraft && input.keepAssetIds.length > 0) {
      await tx.postAsset.updateMany({
        where: {
          id: {
            in: input.keepAssetIds,
          },
        },
        data: {
          pendingDeleteAt: null,
          deleteAttempts: 0,
          lastDeleteError: null,
        },
      })
    }

    return {
      coverImageUrl: nextCoverImageUrl,
      removedAssetCount: removedAssets.length,
    }
  } catch (error) {
    if (isMissingTableError(error, "PostAsset")) {
      return {
        coverImageUrl: input.coverImageUrl,
        removedAssetCount: 0,
      }
    }

    throw error
  }
}

function findFirstLinkByType(links: PreparedLink[], type: PostLinkType) {
  return links.find((link) => link.type === type)?.url ?? null
}

function findWebsiteFallback(links: PreparedLink[]) {
  return links.find((link) => link.type === "WEBSITE" || link.type === "OTHER")?.url ?? null
}

function revalidatePublicPaths(slugs: Array<string | null | undefined>) {
  revalidatePath("/")
  revalidatePath("/notes")
  revalidatePath("/projects")

  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/notes/${slug}`)
    revalidatePath(`/projects/${slug}`)
  }
}

export async function createDraftPost(): Promise<PostActionResult> {
  const user = await requireUser()
  const slug = `draft-${randomUUID()}`

  const draft = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        title: "Untitled draft",
        slug,
        type: "NOTE",
        status: "DRAFT",
        excerpt: "",
        content: buildLegacyContentDocument("Untitled draft", ""),
        markdownSource: null,
        htmlContent: "",
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actionType: "CREATE_DRAFT_POST",
        targetType: "POST",
        targetId: post.id,
        after: JSON.parse(JSON.stringify(post)),
      },
    })

    return post
  })

  return { success: true, id: draft.id }
}

export async function savePost(payload: PostEditorInput): Promise<PostActionResult> {
  const user = await requireUser()

  try {
    const validated = PostSchema.parse({
      ...payload,
      slug: payload.slug || slugify(payload.title),
      content: payload.content ?? buildLegacyContentDocument(payload.title, payload.htmlContent),
    })
    const usesBlockWriter = validated.contentMode === "block"
    const writerAssets = validated.assets.filter(
      (
        asset,
      ): asset is {
        id: string
        kind?: string | null
        url?: string | null
      } => typeof asset.id === "string" && asset.id.length > 0,
    )
    const writerPayload = usesBlockWriter ? buildMarkdownWriterPayload(validated.markdownSource ?? "", writerAssets) : null
    const resolvedContent = writerPayload?.content ?? validated.content ?? buildLegacyContentDocument(validated.title, validated.htmlContent)
    const resolvedHtmlContent = writerPayload?.htmlContent ?? validated.htmlContent
    const resolvedMarkdownSource = usesBlockWriter ? writerPayload?.markdownSource ?? "" : ""
    const keepAssetIds = validated.assets
      .map((asset) => asset.id)
      .filter((assetId): assetId is string => typeof assetId === "string" && assetId.length > 0)
    const resolvedCoverImageUrl = resolveCoverFromAssets(validated.coverImageUrl, validated.assets)
    const mergedLinks = mergeLinks({
      links: validated.links,
      githubUrl: validated.githubUrl,
      demoUrl: validated.demoUrl,
      docsUrl: validated.docsUrl,
    })
    const preparedLinks = await prepareLinks(mergedLinks)

    const result = await prisma.$transaction(async (tx) => {
      const tagConnections = await connectTags(tx, validated.tags)

      if (!validated.id) {
        const created = await tx.post.create({
          data: {
            title: validated.title,
            slug: validated.slug,
            excerpt: validated.excerpt || null,
            content: resolvedContent,
            contentVersion: usesBlockWriter ? POST_BLOCK_CONTENT_VERSION : undefined,
            markdownSource: resolvedMarkdownSource || null,
            htmlContent: resolvedHtmlContent,
            type: validated.type,
            status: validated.status,
            coverImageUrl: resolvedCoverImageUrl,
            githubUrl: findFirstLinkByType(preparedLinks, "GITHUB"),
            demoUrl: findWebsiteFallback(preparedLinks),
            docsUrl: findFirstLinkByType(preparedLinks, "DOCS"),
            publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
            tags: {
              connect: tagConnections,
            },
          },
        })

        await syncPostLinks(tx, created.id, preparedLinks)

        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            actionType: "CREATE_POST",
            targetType: "POST",
            targetId: created.id,
            after: JSON.parse(JSON.stringify(created)),
          },
        })

        return {
          id: created.id,
          slugs: [validated.slug],
        }
      }

      const current = await tx.post.findUnique({
        where: { id: validated.id },
      })

      if (!current) {
        throw new Error("Target post not found.")
      }

      const shouldSnapshot = current.status === "PUBLISHED" || validated.status === "PUBLISHED"
      const isEmptyDraft = isEffectivelyEmptyDraft({
        status: validated.status,
        title: validated.title,
        excerpt: validated.excerpt,
        coverImageUrl: resolvedCoverImageUrl,
        content: resolvedContent,
        activeLinkCount: preparedLinks.length,
      })

      if (shouldSnapshot) {
        await tx.postRevision.create({
          data: {
            postId: current.id,
            title: current.title,
            excerpt: current.excerpt,
            coverImageUrl: current.coverImageUrl,
            content: current.content as Prisma.InputJsonValue,
            contentVersion: current.contentVersion,
            markdownSource: current.markdownSource,
            htmlContent: current.htmlContent,
          },
        })
      }

      const nextVersion = shouldSnapshot ? current.contentVersion + 1 : current.contentVersion
      const assetSync = await syncPostAssets(tx, {
        postId: validated.id,
        keepAssetIds,
        coverImageUrl: resolvedCoverImageUrl,
        isEmptyDraft,
      })
      const publishedAt =
        validated.status === "PUBLISHED"
          ? current.publishedAt ?? new Date()
          : validated.status === "ARCHIVED"
            ? current.publishedAt
            : current.publishedAt

      const updated = await tx.post.update({
        where: { id: validated.id },
        data: {
          title: validated.title,
          slug: validated.slug,
          excerpt: validated.excerpt || null,
          content: resolvedContent,
          htmlContent: resolvedHtmlContent,
          markdownSource: resolvedMarkdownSource || null,
          type: validated.type,
          status: validated.status,
          contentVersion: usesBlockWriter ? POST_BLOCK_CONTENT_VERSION : nextVersion,
          coverImageUrl: assetSync.coverImageUrl,
          githubUrl: findFirstLinkByType(preparedLinks, "GITHUB"),
          demoUrl: findWebsiteFallback(preparedLinks),
          docsUrl: findFirstLinkByType(preparedLinks, "DOCS"),
          publishedAt,
          tags: {
            set: [],
            connect: tagConnections,
          },
        },
      })

      await syncPostLinks(tx, updated.id, preparedLinks)

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actionType: "UPDATE_POST",
          targetType: "POST",
          targetId: updated.id,
          before: JSON.parse(JSON.stringify(current)),
          after: JSON.parse(JSON.stringify(updated)),
        },
      })

      return {
        id: updated.id,
        slugs: [current.slug, validated.slug],
        removedAssetCount: assetSync.removedAssetCount,
      }
    })

    revalidatePublicPaths(result.slugs)

    if ("removedAssetCount" in result && typeof result.removedAssetCount === "number" && result.removedAssetCount > 0) {
      void kickWorkerRoute("/api/worker/asset-cleanup")
    }

    return { success: true, id: result.id }
  } catch (error) {
    console.error("[savePost]", error)
    const normalizedError =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Validation failed."
        : error instanceof Error
          ? error.message
          : "Failed to save post."

    return {
      success: false,
      error: normalizedError,
    }
  }
}

export async function archivePost(postId: string): Promise<PostActionResult> {
  const user = await requireUser()

  try {
    const archived = await prisma.$transaction(async (tx) => {
      const current = await tx.post.findUnique({ where: { id: postId } })

      if (!current) {
        throw new Error("Target post not found.")
      }

      const updated = await tx.post.update({
        where: { id: postId },
        data: { status: "ARCHIVED" },
      })

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actionType: "ARCHIVE_POST",
          targetType: "POST",
          targetId: updated.id,
          before: JSON.parse(JSON.stringify(current)),
          after: JSON.parse(JSON.stringify(updated)),
        },
      })

      return {
        id: updated.id,
        slug: current.slug,
      }
    })

    revalidatePublicPaths([archived.slug])

    return { success: true, id: archived.id }
  } catch (error) {
    console.error("[archivePost]", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to archive post.",
    }
  }
}
