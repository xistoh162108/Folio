export type AdminPostsQueryInput = {
  q?: string | string[] | null
  status?: string | string[] | null
  type?: string | string[] | null
  page?: string | string[] | number | null
}

export type AdminPostsQuery = {
  q: string
  status: "ALL" | "DRAFT" | "PUBLISHED" | "ARCHIVED"
  type: "ALL" | "NOTE" | "PROJECT"
  page: number
  pageSize: number
}

export const DEFAULT_ADMIN_POSTS_PAGE_SIZE = 10

function takeFirst(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  if (typeof value === "number") {
    return String(value)
  }

  return value ?? ""
}

export function normalizeAdminPostsQuery(input: AdminPostsQueryInput = {}): AdminPostsQuery {
  const q = takeFirst(input.q).trim()
  const status = takeFirst(input.status).toUpperCase()
  const type = takeFirst(input.type).toUpperCase()
  const parsedPage = Number.parseInt(takeFirst(input.page), 10)

  return {
    q,
    status: status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" ? status : "ALL",
    type: type === "NOTE" || type === "PROJECT" ? type : "ALL",
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: DEFAULT_ADMIN_POSTS_PAGE_SIZE,
  }
}
