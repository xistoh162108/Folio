export type AdminCommunityQueryInput = {
  commentsPage?: string | string[] | number | null
  guestbookPage?: string | string[] | number | null
}

export type AdminCommunityQuery = {
  commentsPage: number
  guestbookPage: number
  pageSize: number
}

export const DEFAULT_ADMIN_COMMUNITY_PAGE_SIZE = 20

function takeFirst(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  if (typeof value === "number") {
    return String(value)
  }

  return value ?? ""
}

export function normalizeAdminCommunityQuery(input: AdminCommunityQueryInput = {}): AdminCommunityQuery {
  const parsedCommentsPage = Number.parseInt(takeFirst(input.commentsPage), 10)
  const parsedGuestbookPage = Number.parseInt(takeFirst(input.guestbookPage), 10)

  return {
    commentsPage: Number.isFinite(parsedCommentsPage) && parsedCommentsPage > 0 ? parsedCommentsPage : 1,
    guestbookPage: Number.isFinite(parsedGuestbookPage) && parsedGuestbookPage > 0 ? parsedGuestbookPage : 1,
    pageSize: DEFAULT_ADMIN_COMMUNITY_PAGE_SIZE,
  }
}
