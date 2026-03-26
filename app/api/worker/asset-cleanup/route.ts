import { NextResponse } from "next/server"

import { isEffectivelyEmptyDraft } from "@/lib/content/draft-state"
import { isMissingColumnError, isMissingRecordError, isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { deleteAssetFromSupabase } from "@/lib/storage/supabase"

const BATCH_SIZE = 50
const EMPTY_DRAFT_RETENTION_DAYS = 30
const ARCHIVED_RETENTION_DAYS = 90

type AssetCleanupCandidate = {
  id: string
  bucket: string
  storagePath: string
  createdAt: Date
  pendingDeleteAt: Date | null
  post: {
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    content: unknown
    updatedAt: Date
    githubUrl: string | null
    demoUrl: string | null
    docsUrl: string | null
    links: Array<{ id: string }>
  }
}

const assetCleanupSelect = {
  id: true,
  bucket: true,
  storagePath: true,
  createdAt: true,
  pendingDeleteAt: true,
  post: {
    select: {
      status: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      content: true,
      updatedAt: true,
      githubUrl: true,
      demoUrl: true,
      docsUrl: true,
      links: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  },
} as const

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000)
}

function countActiveLinks(candidate: AssetCleanupCandidate) {
  let legacyCount = 0

  if (candidate.post.githubUrl) legacyCount += 1
  if (candidate.post.demoUrl) legacyCount += 1
  if (candidate.post.docsUrl) legacyCount += 1

  return candidate.post.links.length + legacyCount
}

function isRetentionCandidate(candidate: AssetCleanupCandidate, now: Date) {
  if (candidate.post.status === "ARCHIVED") {
    return candidate.post.updatedAt <= subtractDays(now, ARCHIVED_RETENTION_DAYS)
  }

  if (candidate.post.status !== "DRAFT") {
    return false
  }

  if (candidate.post.updatedAt > subtractDays(now, EMPTY_DRAFT_RETENTION_DAYS)) {
    return false
  }

  return isEffectivelyEmptyDraft({
    status: candidate.post.status,
    title: candidate.post.title,
    excerpt: candidate.post.excerpt,
    coverImageUrl: candidate.post.coverImageUrl,
    content: candidate.post.content,
    activeLinkCount: countActiveLinks(candidate),
  })
}

async function recordDeleteFailure(assetId: string, message: string) {
  try {
    await prisma.postAsset.updateMany({
      where: { id: assetId },
      data: {
        deleteAttempts: {
          increment: 1,
        },
        lastDeleteError: message,
      },
    })
  } catch (error) {
    console.error("[asset-cleanup] failed to record cleanup failure", error)
  }
}

async function collectCleanupCandidates(now: Date) {
  const pendingAssets = await prisma.postAsset.findMany({
    where: {
      pendingDeleteAt: {
        not: null,
        lte: now,
      },
    },
    select: assetCleanupSelect,
    orderBy: [{ pendingDeleteAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    take: BATCH_SIZE,
  })

  const remainingSlots = BATCH_SIZE - pendingAssets.length
  if (remainingSlots <= 0) {
    return pendingAssets
  }

  const retentionCandidates = await prisma.postAsset.findMany({
    where: {
      pendingDeleteAt: null,
      OR: [
        {
          post: {
            status: "ARCHIVED",
            updatedAt: {
              lte: subtractDays(now, ARCHIVED_RETENTION_DAYS),
            },
          },
        },
        {
          post: {
            status: "DRAFT",
            updatedAt: {
              lte: subtractDays(now, EMPTY_DRAFT_RETENTION_DAYS),
            },
          },
        },
      ],
    },
    select: assetCleanupSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: BATCH_SIZE * 3,
  })

  const eligibleRetentionAssets = retentionCandidates.filter((candidate) => isRetentionCandidate(candidate, now)).slice(0, remainingSlots)

  if (eligibleRetentionAssets.length === 0) {
    return pendingAssets
  }

  await prisma.postAsset.updateMany({
    where: {
      id: {
        in: eligibleRetentionAssets.map((asset) => asset.id),
      },
    },
    data: {
      pendingDeleteAt: now,
      deleteAttempts: 0,
      lastDeleteError: null,
    },
  })

  const markedRetentionAssets = eligibleRetentionAssets.map((asset) => ({
    ...asset,
    pendingDeleteAt: now,
  }))

  return [...pendingAssets, ...markedRetentionAssets].sort((left, right) => {
    const leftPendingAt = left.pendingDeleteAt?.getTime() ?? 0
    const rightPendingAt = right.pendingDeleteAt?.getTime() ?? 0

    if (leftPendingAt !== rightPendingAt) {
      return leftPendingAt - rightPendingAt
    }

    if (left.createdAt.getTime() !== right.createdAt.getTime()) {
      return left.createdAt.getTime() - right.createdAt.getTime()
    }

    return left.id.localeCompare(right.id)
  })
}

async function handleAssetCleanupWorker(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const now = new Date()
    const candidates = await collectCleanupCandidates(now)

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, processed: 0, deleted: 0, failed: 0 })
    }

    let deleted = 0
    let failed = 0

    for (const asset of candidates) {
      try {
        await deleteAssetFromSupabase(asset.bucket, asset.storagePath)

        try {
          await prisma.postAsset.delete({
            where: { id: asset.id },
          })
        } catch (error) {
          if (!isMissingRecordError(error)) {
            throw error
          }
        }

        deleted += 1
      } catch (error) {
        failed += 1
        await recordDeleteFailure(
          asset.id,
          error instanceof Error ? error.message : "Asset cleanup failed.",
        )
      }
    }

    return NextResponse.json({
      success: true,
      processed: candidates.length,
      deleted,
      failed,
    })
  } catch (error) {
    if (
      isMissingTableError(error, "PostAsset") ||
      isMissingColumnError(error, "pendingDeleteAt")
    ) {
      return NextResponse.json(
        { error: "PostAsset cleanup migration has not been applied yet." },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset cleanup worker failed." },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return handleAssetCleanupWorker(request)
}

export async function POST(request: Request) {
  return handleAssetCleanupWorker(request)
}
