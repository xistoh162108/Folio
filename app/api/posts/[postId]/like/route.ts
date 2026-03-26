import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

const LikeSchema = z.object({
  sessionId: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params

  try {
    const { sessionId } = LikeSchema.parse(await request.json())
    const ip = getClientIp(request.headers)

    assertRateLimit({
      namespace: "post-like",
      identifier: `${sessionId}:${ip}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Published post not found." }, { status: 404 })
    }

    const existing = await prisma.postLike.findUnique({
      where: {
        postId_sessionId: {
          postId,
          sessionId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!existing) {
      await prisma.postLike.create({
        data: {
          postId,
          sessionId,
        },
      })
    }

    const count = await prisma.postLike.count({
      where: {
        postId,
      },
    })

    return NextResponse.json({
      success: true,
      liked: !existing,
      alreadyLiked: Boolean(existing),
      count,
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    const message = error instanceof Error ? error.message : "Could not record like."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
