import "server-only"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export async function getGuestbookEntries(limit = 50): Promise<GuestbookEntryDTO[]> {
  try {
    const entries = await prisma.guestbookEntry.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        message: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return entries.map((entry) => ({
      id: entry.id,
      message: entry.message,
      sourceLabel: toLogSourceLabel(entry.userAgent),
      createdAt: entry.createdAt.toISOString(),
    }))
  } catch (error) {
    if (isMissingTableError(error, "GuestbookEntry")) {
      return []
    }

    throw error
  }
}
