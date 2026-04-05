import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const postFindFirstMock = vi.fn()
const postFindUniqueMock = vi.fn()
const postFindManyMock = vi.fn()
const postAssetFindManyMock = vi.fn()
const postLinkFindManyMock = vi.fn()
const linkPreviewFindManyMock = vi.fn()
const postCommentCountMock = vi.fn()
const postCommentFindManyMock = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    post: {
      findFirst: postFindFirstMock,
      findUnique: postFindUniqueMock,
      findMany: postFindManyMock,
    },
    postAsset: {
      findMany: postAssetFindManyMock,
    },
    postLink: {
      findMany: postLinkFindManyMock,
    },
    linkPreviewCache: {
      findMany: linkPreviewFindManyMock,
    },
    postComment: {
      count: postCommentCountMock,
      findMany: postCommentFindManyMock,
    },
  },
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

let getPublishedPostDetail: typeof import("@/lib/data/posts").getPublishedPostDetail
let getAdminPostEditorState: typeof import("@/lib/data/posts").getAdminPostEditorState

beforeAll(async () => {
  ;({ getPublishedPostDetail, getAdminPostEditorState } = await import("@/lib/data/posts"))
})

beforeEach(() => {
  postFindFirstMock.mockReset()
  postFindUniqueMock.mockReset()
  postFindManyMock.mockReset()
  postAssetFindManyMock.mockReset().mockResolvedValue([])
  postLinkFindManyMock.mockReset().mockResolvedValue([])
  linkPreviewFindManyMock.mockReset().mockResolvedValue([])
  postCommentCountMock.mockReset().mockResolvedValue(0)
  postCommentFindManyMock.mockReset().mockResolvedValue([])
})

describe("getPublishedPostDetail", () => {
  it("maps published previous and next notes onto note detail data", async () => {
    postFindFirstMock
      .mockResolvedValueOnce({
        id: "note-current",
        slug: "current-note",
        type: "NOTE",
        status: "PUBLISHED",
        previousNoteId: "note-prev",
        title: "Current Note",
        excerpt: "Current",
        tags: [{ name: "AI" }],
        views: 42,
        coverImageUrl: null,
        publishedAt: new Date("2026-04-05T00:00:00.000Z"),
        updatedAt: new Date("2026-04-05T00:00:00.000Z"),
        _count: { likes: 0 },
        contentVersion: 1,
        markdownSource: null,
        htmlContent: "<p>Current</p>",
        content: { type: "doc", blocks: [] },
        githubUrl: null,
        demoUrl: null,
        docsUrl: null,
      })
      .mockResolvedValueOnce({
        id: "note-prev",
        slug: "previous-note",
        title: "Previous Note",
        type: "NOTE",
        status: "PUBLISHED",
        previousNoteId: null,
      })
      .mockResolvedValueOnce({
        id: "note-next",
        slug: "next-note",
        title: "Next Note",
        type: "NOTE",
        status: "PUBLISHED",
        previousNoteId: "note-current",
      })

    const detail = await getPublishedPostDetail("NOTE", "current-note")

    expect(detail.previousNote).toEqual({
      id: "note-prev",
      slug: "previous-note",
      title: "Previous Note",
    })
    expect(detail.nextNote).toEqual({
      id: "note-next",
      slug: "next-note",
      title: "Next Note",
    })
  })

  it("keeps public previous and next links null when unpublished candidates are filtered out", async () => {
    postFindFirstMock
      .mockResolvedValueOnce({
        id: "note-current-2",
        slug: "current-note-2",
        type: "NOTE",
        status: "PUBLISHED",
        previousNoteId: "note-prev-draft",
        title: "Current Note 2",
        excerpt: "Current",
        tags: [{ name: "AI" }],
        views: 7,
        coverImageUrl: null,
        publishedAt: new Date("2026-04-05T00:00:00.000Z"),
        updatedAt: new Date("2026-04-05T00:00:00.000Z"),
        _count: { likes: 0 },
        contentVersion: 1,
        markdownSource: null,
        htmlContent: "<p>Current</p>",
        content: { type: "doc", blocks: [] },
        githubUrl: null,
        demoUrl: null,
        docsUrl: null,
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const detail = await getPublishedPostDetail("NOTE", "current-note-2")

    expect(detail.previousNote).toBeNull()
    expect(detail.nextNote).toBeNull()
    expect(postFindFirstMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: "note-prev-draft",
          type: "NOTE",
          status: "PUBLISHED",
        },
      }),
    )
    expect(postFindFirstMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          previousNoteId: "note-current-2",
          type: "NOTE",
          status: "PUBLISHED",
        },
      }),
    )
  })
})

describe("getAdminPostEditorState", () => {
  it("returns previousNoteId and note-only selector options", async () => {
    postFindUniqueMock.mockResolvedValue({
      id: "note-current",
      slug: "current-note",
      type: "NOTE",
      status: "DRAFT",
      previousNoteId: "note-prev",
      title: "Current Note",
      excerpt: "",
      contentVersion: 1,
      markdownSource: null,
      htmlContent: "<p>Current</p>",
      content: { type: "doc", blocks: [] },
      coverImageUrl: null,
      githubUrl: null,
      demoUrl: null,
      docsUrl: null,
      tags: [{ name: "AI" }],
    })
    postFindManyMock.mockResolvedValue([
      {
        id: "note-prev",
        slug: "previous-note",
        title: "Previous Note",
        status: "PUBLISHED",
        publishedAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-02T00:00:00.000Z"),
      },
      {
        id: "note-draft",
        slug: "draft-note",
        title: "Draft Note",
        status: "DRAFT",
        publishedAt: null,
        updatedAt: new Date("2026-04-03T00:00:00.000Z"),
      },
    ])

    const editorState = await getAdminPostEditorState("note-current")

    expect(editorState.post.previousNoteId).toBe("note-prev")
    expect(editorState.previousNoteOptions).toEqual([
      {
        id: "note-prev",
        slug: "previous-note",
        label: "2026-04-01 - Previous Note",
      },
      {
        id: "note-draft",
        slug: "draft-note",
        label: "2026-04-03 - Draft Note [draft]",
      },
    ])
    expect(postFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          type: "NOTE",
          id: { not: "note-current" },
        },
      }),
    )
  })
})
