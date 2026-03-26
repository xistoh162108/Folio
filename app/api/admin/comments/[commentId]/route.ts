import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const { commentId } = await params

  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }

    const ip = getClientIp(request.headers)
    assertRateLimit({
      namespace: "admin-community-delete",
      identifier: `${session.user.id}:${ip}`,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    })

    await prisma.postComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (isMissingTableError(error, "PostComment")) {
      return NextResponse.json({ error: "Comment migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not moderate comment."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
