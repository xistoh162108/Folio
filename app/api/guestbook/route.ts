import { NextResponse } from "next/server"
import { z } from "zod"

import { getGuestbookEntriesPage } from "@/lib/data/guestbook"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { sha256 } from "@/lib/utils/hash"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

const GuestbookSchema = z.object({
  message: z.string().trim().min(1).max(280),
  _honey: z.string().optional().default(""),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page")
  const pageSize = searchParams.get("pageSize")
  const result = await getGuestbookEntriesPage({
    page,
    pageSize: pageSize ? Number.parseInt(pageSize, 10) : undefined,
  })

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  try {
    const payload = GuestbookSchema.parse(await request.json())
    const ip = getClientIp(request.headers)

    if (payload._honey.trim().length > 0) {
      return NextResponse.json({ error: "Spam detected." }, { status: 400 })
    }

    assertRateLimit({
      namespace: "guestbook-entry-create",
      identifier: ip,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })

    const userAgent = request.headers.get("user-agent")
    const entry = await prisma.guestbookEntry.create({
      data: {
        message: payload.message,
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
      entry: {
        id: entry.id,
        message: entry.message,
        sourceLabel: toLogSourceLabel(entry.userAgent),
        createdAt: entry.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    if (isMissingTableError(error, "GuestbookEntry")) {
      return NextResponse.json({ error: "Guestbook migrations have not been applied yet." }, { status: 503 })
    }

    const message = error instanceof Error ? error.message : "Could not write guestbook entry."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
