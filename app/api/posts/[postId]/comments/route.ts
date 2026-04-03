import { hash } from "bcrypt"
import { NextResponse } from "next/server"
import { z } from "zod"

import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { sha256 } from "@/lib/utils/hash"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

const CommentSchema = z.object({
  message: z.string().trim().min(1).max(500),
  pin: z.string().regex(/^\d{4}$/),
  _honey: z.string().optional().default(""),
})

const CommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().min(1).optional(),
  direction: z.enum(["forward", "backward"]).optional(),
})

function mapComment(comment: { id: string; message: string; userAgent: string | null; createdAt: Date }) {
  return {
    id: comment.id,
    message: comment.message,
    sourceLabel: toLogSourceLabel(comment.userAgent),
    createdAt: comment.createdAt.toISOString(),
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params

  try {
    const parsed = CommentsQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()))
    const take = parsed.take ?? 20

    if (parsed.cursor) {
      const direction = parsed.direction ?? "forward"
      const comments = await prisma.postComment.findMany({
        where: {
          postId,
          deletedAt: null,
        },
        cursor: { id: parsed.cursor },
        skip: 1,
        take,
        orderBy: direction === "backward" ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          message: true,
          userAgent: true,
          createdAt: true,
        },
      })

      const normalized = direction === "backward" ? comments.reverse() : comments

      return NextResponse.json({
        success: true,
        comments: normalized.map(mapComment),
        query: {
          take,
          cursor: parsed.cursor,
          direction,
          order: "latest-first",
        },
      })
    }

    const page = parsed.page ?? 1
    const [total, comments] = await Promise.all([
      prisma.postComment.count({
        where: {
          postId,
          deletedAt: null,
        },
      }),
      prisma.postComment.findMany({
        where: {
          postId,
          deletedAt: null,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * take,
        take,
        select: {
          id: true,
          message: true,
          userAgent: true,
          createdAt: true,
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / take))

    return NextResponse.json({
      success: true,
      comments: comments.map(mapComment),
      query: {
        page,
        take,
        order: "latest-first",
      },
      pagination: {
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    if (isMissingTableError(error, "PostComment")) {
      return NextResponse.json({ error: "Comment migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not list comments."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params

  try {
    const payload = CommentSchema.parse(await request.json())
    const ip = getClientIp(request.headers)

    if (payload._honey.trim().length > 0) {
      return NextResponse.json({ error: "Spam detected." }, { status: 400 })
    }

    assertRateLimit({
      namespace: "post-comment-create",
      identifier: `${postId}:${ip}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: "PUBLISHED",
      },
      select: { id: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Published post not found." }, { status: 404 })
    }

    const userAgent = request.headers.get("user-agent")
    const comment = await prisma.postComment.create({
      data: {
        postId,
        message: payload.message,
        pinHash: await hash(payload.pin, 10),
        ipHash: sha256(ip),
        userAgent,
      },
      select: {
        id: true,
        message: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      comment: mapComment(comment),
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (isMissingTableError(error, "PostComment")) {
      return NextResponse.json({ error: "Comment migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not create comment."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
