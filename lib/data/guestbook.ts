import "server-only"

import type { GuestbookEntryDTO, PaginatedGuestbookEntriesDTO } from "@/lib/contracts/community"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export interface GuestbookEntriesQueryInput {
  page?: string | number | null
  pageSize?: number | null
}

export interface GuestbookEntriesQuery {
  page: number
  pageSize: number
}

const DEFAULT_GUESTBOOK_PAGE_SIZE = 20

function normalizeGuestbookEntriesQuery(input: GuestbookEntriesQueryInput = {}): GuestbookEntriesQuery {
  const pageValue =
    typeof input.page === "number"
      ? input.page
      : typeof input.page === "string"
        ? Number.parseInt(input.page, 10)
        : 1

  return {
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize: input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_GUESTBOOK_PAGE_SIZE,
  }
}

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

export async function getGuestbookEntriesPage(input: GuestbookEntriesQueryInput = {}): Promise<PaginatedGuestbookEntriesDTO> {
  const query = normalizeGuestbookEntriesQuery(input)

  try {
    const total = await prisma.guestbookEntry.count({
      where: { deletedAt: null },
    })
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize))
    const page = Math.min(query.page, totalPages)
    const entries = await prisma.guestbookEntry.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        message: true,
        userAgent: true,
        createdAt: true,
      },
    })

    return {
      entries: entries.map((entry) => ({
        id: entry.id,
        message: entry.message,
        sourceLabel: toLogSourceLabel(entry.userAgent),
        createdAt: entry.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize: query.pageSize,
        total,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
      },
    }
  } catch (error) {
    if (isMissingTableError(error, "GuestbookEntry")) {
      return {
        entries: [],
        pagination: {
          page: 1,
          pageSize: query.pageSize,
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
