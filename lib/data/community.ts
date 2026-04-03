import "server-only"

import type {
  CommunityModerationCommentDTO,
  CommunityModerationGuestbookEntryDTO,
} from "@/lib/contracts/community"
import {
  type AdminCommunityQuery,
  type AdminCommunityQueryInput,
  normalizeAdminCommunityQuery,
} from "@/lib/data/admin-community-query"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export interface CommunityModerationSnapshot {
  comments: CommunityModerationCommentDTO[]
  guestbookEntries: CommunityModerationGuestbookEntryDTO[]
  counts: {
    comments: number
    guestbookEntries: number
  }
  pagination: {
    comments: {
      page: number
      pageSize: number
      totalPages: number
    }
    guestbookEntries: {
      page: number
      pageSize: number
      totalPages: number
    }
  }
  query: AdminCommunityQuery
}

export async function getCommunityModerationSnapshot(input: AdminCommunityQueryInput = {}): Promise<CommunityModerationSnapshot> {
  const query = normalizeAdminCommunityQuery(input)

  try {
    const [commentsTotal, guestbookTotal] = await Promise.all([
      prisma.postComment.count({
        where: { deletedAt: null },
      }),
      prisma.guestbookEntry.count({
        where: { deletedAt: null },
      }),
    ])
    const commentsTotalPages = Math.max(1, Math.ceil(commentsTotal / query.pageSize))
    const guestbookTotalPages = Math.max(1, Math.ceil(guestbookTotal / query.pageSize))
    const commentsPage = Math.min(query.commentsPage, commentsTotalPages)
    const guestbookPage = Math.min(query.guestbookPage, guestbookTotalPages)
    const [comments, guestbookEntries] = await Promise.all([
      prisma.postComment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (commentsPage - 1) * query.pageSize,
        take: query.pageSize,
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
        skip: (guestbookPage - 1) * query.pageSize,
        take: query.pageSize,
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
      counts: {
        comments: commentsTotal,
        guestbookEntries: guestbookTotal,
      },
      pagination: {
        comments: {
          page: commentsPage,
          pageSize: query.pageSize,
          totalPages: commentsTotalPages,
        },
        guestbookEntries: {
          page: guestbookPage,
          pageSize: query.pageSize,
          totalPages: guestbookTotalPages,
        },
      },
      query: {
        ...query,
        commentsPage,
        guestbookPage,
      },
    }
  } catch (error) {
    if (isMissingTableError(error, "PostComment") || isMissingTableError(error, "GuestbookEntry")) {
      return {
        comments: [],
        guestbookEntries: [],
        counts: {
          comments: 0,
          guestbookEntries: 0,
        },
        pagination: {
          comments: {
            page: 1,
            pageSize: query.pageSize,
            totalPages: 1,
          },
          guestbookEntries: {
            page: 1,
            pageSize: query.pageSize,
            totalPages: 1,
          },
        },
        query,
      }
    }

    throw error
  }
}
