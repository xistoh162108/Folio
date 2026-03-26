import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params

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

    await prisma.guestbookEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (isMissingTableError(error, "GuestbookEntry")) {
      return NextResponse.json({ error: "Guestbook migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not moderate guestbook entry."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
