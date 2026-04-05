import type { NoteNavigationLinkDTO, NoteNavigationOption, PostKind, PostStatus } from "@/lib/contracts/posts"

type NullableId = string | null | undefined

export interface NoteNavigationRecord {
  id: string
  slug: string
  title: string
  type: PostKind
  status: PostStatus
  previousNoteId: string | null
  publishedAt?: Date | null
  updatedAt?: Date | null
}

export interface ValidatePreviousNoteSelectionInput {
  postId?: NullableId
  type: PostKind
  previousNoteId?: NullableId
}

export interface ValidatePreviousNoteSelectionDeps {
  getPostById: (id: string) => Promise<NoteNavigationRecord | null>
  getPostByPreviousNoteId: (previousNoteId: string) => Promise<Pick<NoteNavigationRecord, "id"> | null>
}

function normalizeNullableId(value: NullableId) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function formatNoteNavigationDate(publishedAt?: Date | null, updatedAt?: Date | null) {
  return (publishedAt ?? updatedAt)?.toISOString().slice(0, 10) ?? "--------"
}

export function buildNoteNavigationOption(post: Pick<NoteNavigationRecord, "id" | "slug" | "title" | "status" | "publishedAt" | "updatedAt">): NoteNavigationOption {
  const statusSuffix = post.status === "PUBLISHED" ? "" : ` [${post.status.toLowerCase()}]`
  return {
    id: post.id,
    slug: post.slug,
    label: `${formatNoteNavigationDate(post.publishedAt, post.updatedAt)} - ${post.title}${statusSuffix}`,
  }
}

export function toNoteNavigationLink(post: Pick<NoteNavigationRecord, "id" | "slug" | "title">): NoteNavigationLinkDTO {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
  }
}

export function isPublishedNoteRecord(post: Pick<NoteNavigationRecord, "type" | "status"> | null | undefined) {
  return post?.type === "NOTE" && post.status === "PUBLISHED"
}

export async function validatePreviousNoteSelection(
  input: ValidatePreviousNoteSelectionInput,
  deps: ValidatePreviousNoteSelectionDeps,
) {
  if (input.type !== "NOTE") {
    return null
  }

  const previousNoteId = normalizeNullableId(input.previousNoteId)

  if (!previousNoteId) {
    return null
  }

  const postId = normalizeNullableId(input.postId)

  if (postId && previousNoteId === postId) {
    throw new Error("A note cannot point to itself as the previous note.")
  }

  const previousNote = await deps.getPostById(previousNoteId)

  if (!previousNote || previousNote.type !== "NOTE") {
    throw new Error("Previous note must point to another note.")
  }

  const duplicateNext = await deps.getPostByPreviousNoteId(previousNoteId)

  if (duplicateNext && duplicateNext.id !== postId) {
    throw new Error("That previous note is already claimed by another next note.")
  }

  if (!postId) {
    return previousNoteId
  }

  const seen = new Set<string>()
  let cursorId: string | null = previousNoteId

  while (cursorId) {
    if (cursorId === postId) {
      throw new Error("Previous note selection would create a cycle.")
    }

    if (seen.has(cursorId)) {
      throw new Error("Previous note chain already contains a cycle.")
    }

    seen.add(cursorId)
    const cursor = await deps.getPostById(cursorId)

    if (!cursor) {
      break
    }

    if (cursor.type !== "NOTE") {
      throw new Error("Previous note chain must stay within notes.")
    }

    cursorId = cursor.previousNoteId
  }

  return previousNoteId
}
