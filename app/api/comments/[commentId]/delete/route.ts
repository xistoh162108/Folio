import { compare } from "bcrypt"
import { NextResponse } from "next/server"
import { z } from "zod"

import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

const DeleteSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const { commentId } = await params

  try {
    const payload = DeleteSchema.parse(await request.json())
    const ip = getClientIp(request.headers)

    assertRateLimit({
      namespace: "post-comment-delete",
      identifier: `${commentId}:${ip}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        pinHash: true,
        deletedAt: true,
      },
    })

    if (!comment || comment.deletedAt) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 })
    }

    const isMatch = await compare(payload.pin, comment.pinHash)
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 })
    }

    await prisma.postComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (isMissingTableError(error, "PostComment")) {
      return NextResponse.json({ error: "Comment migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not delete comment."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
