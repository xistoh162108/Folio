import "server-only"

import type {
  CommunityModerationCommentDTO,
  CommunityModerationGuestbookEntryDTO,
  PaginatedCollectionStateDTO,
} from "@/lib/contracts/community"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export interface CommunityModerationSnapshot {
  comments: CommunityModerationCommentDTO[]
  guestbookEntries: CommunityModerationGuestbookEntryDTO[]
  commentsPagination: PaginatedCollectionStateDTO
  guestbookPagination: PaginatedCollectionStateDTO
}

export interface CommunityModerationQueryInput {
  commentPage?: string | number | null
  guestbookPage?: string | number | null
  pageSize?: number | null
}

function normalizeCommunityPage(value?: string | number | null) {
  const pageValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : 1

  return Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
}

export async function getCommunityModerationSnapshot(
  input: CommunityModerationQueryInput = {},
): Promise<CommunityModerationSnapshot> {
  const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20

  try {
    const [commentTotal, guestbookTotal] = await Promise.all([
      prisma.postComment.count({
        where: { deletedAt: null },
      }),
      prisma.guestbookEntry.count({
        where: { deletedAt: null },
      }),
    ])
    const commentTotalPages = Math.max(1, Math.ceil(commentTotal / pageSize))
    const guestbookTotalPages = Math.max(1, Math.ceil(guestbookTotal / pageSize))
    const commentPage = Math.min(normalizeCommunityPage(input.commentPage), commentTotalPages)
    const guestbookPage = Math.min(normalizeCommunityPage(input.guestbookPage), guestbookTotalPages)

    const [comments, guestbookEntries] = await Promise.all([
      prisma.postComment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (commentPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          message: true,
          userAgent: true,
          createdAt: true,
          postId: true,
          post: {
            select: {
              slug: true,
              title: true,
              type: true,
            },
          },
        },
      }),
      prisma.guestbookEntry.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (guestbookPage - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          message: true,
          userAgent: true,
          createdAt: true,
        },
      }),
    ])

    return {
      comments: comments.map((comment) => ({
        id: comment.id,
        message: comment.message,
        sourceLabel: toLogSourceLabel(comment.userAgent),
        createdAt: comment.createdAt.toISOString(),
        postId: comment.postId,
        postTitle: comment.post.title,
        postSlug: comment.post.slug,
        postType: comment.post.type,
      })),
      guestbookEntries: guestbookEntries.map((entry) => ({
        id: entry.id,
        message: entry.message,
        sourceLabel: toLogSourceLabel(entry.userAgent),
        createdAt: entry.createdAt.toISOString(),
      })),
      commentsPagination: {
        page: commentPage,
        pageSize,
        total: commentTotal,
        totalPages: commentTotalPages,
        hasPrevious: commentPage > 1,
        hasNext: commentPage < commentTotalPages,
      },
      guestbookPagination: {
        page: guestbookPage,
        pageSize,
        total: guestbookTotal,
        totalPages: guestbookTotalPages,
        hasPrevious: guestbookPage > 1,
        hasNext: guestbookPage < guestbookTotalPages,
      },
    }
  } catch (error) {
    if (isMissingTableError(error, "PostComment") || isMissingTableError(error, "GuestbookEntry")) {
      return {
        comments: [],
        guestbookEntries: [],
        commentsPagination: {
          page: 1,
          pageSize,
          total: 0,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
        guestbookPagination: {
          page: 1,
          pageSize,
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
