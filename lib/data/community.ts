import "server-only"

import type {
  CommunityModerationCommentDTO,
  CommunityModerationGuestbookEntryDTO,
} from "@/lib/contracts/community"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export interface CommunityModerationSnapshot {
  comments: CommunityModerationCommentDTO[]
  guestbookEntries: CommunityModerationGuestbookEntryDTO[]
}

export async function getCommunityModerationSnapshot(): Promise<CommunityModerationSnapshot> {
  try {
    const [comments, guestbookEntries] = await Promise.all([
      prisma.postComment.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
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
        take: 50,
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
    }
  } catch (error) {
    if (isMissingTableError(error, "PostComment") || isMissingTableError(error, "GuestbookEntry")) {
      return {
        comments: [],
        guestbookEntries: [],
      }
    }

    throw error
  }
}
