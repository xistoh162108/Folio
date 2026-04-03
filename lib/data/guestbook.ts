import "server-only"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { toLogSourceLabel } from "@/lib/utils/user-agent"

export const DEFAULT_GUESTBOOK_PAGE_SIZE = 10

export type GuestbookEntriesPage = {
  entries: GuestbookEntryDTO[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export function normalizeGuestbookPageQuery(input: { page?: string | string[] | number | null } = {}): number {
  const value = Array.isArray(input.page) ? input.page[0] : input.page
  const parsed = Number.parseInt(String(value ?? ""), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
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

export async function getGuestbookEntriesPage(
  pageInput: { page?: string | string[] | number | null } = {},
  pageSize = DEFAULT_GUESTBOOK_PAGE_SIZE,
): Promise<GuestbookEntriesPage> {
  const page = normalizeGuestbookPageQuery(pageInput)

  try {
    const [total, rows] = await prisma.$transaction([
      prisma.guestbookEntry.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.guestbookEntry.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          message: true,
          userAgent: true,
          createdAt: true,
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const pageEntries =
      safePage === page
        ? rows
        : await prisma.guestbookEntry.findMany({
            where: {
              deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
            skip: (safePage - 1) * pageSize,
            take: pageSize,
            select: {
              id: true,
              message: true,
              userAgent: true,
              createdAt: true,
            },
          })

    return {
      entries: pageEntries.map((entry) => ({
        id: entry.id,
        message: entry.message,
        sourceLabel: toLogSourceLabel(entry.userAgent),
        createdAt: entry.createdAt.toISOString(),
      })),
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    }
  } catch (error) {
    if (isMissingTableError(error, "GuestbookEntry")) {
      return {
        entries: [],
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      }
    }

    throw error
  }
}
