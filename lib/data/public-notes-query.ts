export type PublicNotesQueryInput = {
  tag?: string | string[] | null
  page?: string | string[] | number | null
}

export type PublicNotesQuery = {
  tag: string
  page: number
  pageSize: number
}

export const PUBLIC_NOTES_PAGE_SIZE = 5

function takeFirst(value: string | string[] | number | null | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  if (typeof value === "number") {
    return String(value)
  }

  return value ?? ""
}

export function normalizePublicNotesQuery(
  input: PublicNotesQueryInput = {},
  allowedTags: readonly string[],
): PublicNotesQuery {
  const requestedTag = takeFirst(input.tag).trim()
  const parsedPage = Number.parseInt(takeFirst(input.page), 10)

  return {
    tag: allowedTags.includes(requestedTag) ? requestedTag : "All",
    page: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: PUBLIC_NOTES_PAGE_SIZE,
  }
}

export function makePublicNotesHref(basePath: string, query: PublicNotesQuery, overrides: Partial<PublicNotesQuery> = {}) {
  const nextQuery = {
    ...query,
    ...overrides,
  }

  const params = new URLSearchParams()

  if (nextQuery.tag !== "All") {
    params.set("tag", nextQuery.tag)
  }

  if (nextQuery.page > 1) {
    params.set("page", String(nextQuery.page))
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}
