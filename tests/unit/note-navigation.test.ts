import { describe, expect, it, vi } from "vitest"

import { validatePreviousNoteSelection } from "@/lib/posts/note-navigation"

describe("validatePreviousNoteSelection", () => {
  it("clears previous-note links for projects", async () => {
    const getPostById = vi.fn()
    const getPostByPreviousNoteId = vi.fn()

    await expect(
      validatePreviousNoteSelection(
        {
          postId: "project-1",
          type: "PROJECT",
          previousNoteId: "note-1",
        },
        {
          getPostById,
          getPostByPreviousNoteId,
        },
      ),
    ).resolves.toBeNull()

    expect(getPostById).not.toHaveBeenCalled()
    expect(getPostByPreviousNoteId).not.toHaveBeenCalled()
  })

  it("rejects self-links", async () => {
    await expect(
      validatePreviousNoteSelection(
        {
          postId: "note-1",
          type: "NOTE",
          previousNoteId: "note-1",
        },
        {
          getPostById: vi.fn(),
          getPostByPreviousNoteId: vi.fn(),
        },
      ),
    ).rejects.toThrow("cannot point to itself")
  })

  it("rejects duplicate-next conflicts", async () => {
    await expect(
      validatePreviousNoteSelection(
        {
          postId: "note-2",
          type: "NOTE",
          previousNoteId: "note-1",
        },
        {
          getPostById: vi.fn().mockResolvedValue({
            id: "note-1",
            slug: "note-1",
            title: "Note 1",
            type: "NOTE",
            status: "PUBLISHED",
            previousNoteId: null,
          }),
          getPostByPreviousNoteId: vi.fn().mockResolvedValue({ id: "note-3" }),
        },
      ),
    ).rejects.toThrow("already claimed")
  })

  it("rejects cycle creation", async () => {
    const posts = new Map([
      [
        "note-2",
        {
          id: "note-2",
          slug: "note-2",
          title: "Note 2",
          type: "NOTE" as const,
          status: "PUBLISHED" as const,
          previousNoteId: "note-1",
        },
      ],
      [
        "note-3",
        {
          id: "note-3",
          slug: "note-3",
          title: "Note 3",
          type: "NOTE" as const,
          status: "PUBLISHED" as const,
          previousNoteId: "note-2",
        },
      ],
    ])

    await expect(
      validatePreviousNoteSelection(
        {
          postId: "note-1",
          type: "NOTE",
          previousNoteId: "note-3",
        },
        {
          getPostById: vi.fn(async (id: string) => posts.get(id) ?? null),
          getPostByPreviousNoteId: vi.fn().mockResolvedValue(null),
        },
      ),
    ).rejects.toThrow("create a cycle")
  })

  it("accepts a valid previous note link", async () => {
    await expect(
      validatePreviousNoteSelection(
        {
          postId: "note-2",
          type: "NOTE",
          previousNoteId: "note-1",
        },
        {
          getPostById: vi.fn().mockResolvedValue({
            id: "note-1",
            slug: "note-1",
            title: "Note 1",
            type: "NOTE",
            status: "PUBLISHED",
            previousNoteId: null,
          }),
          getPostByPreviousNoteId: vi.fn().mockResolvedValue({ id: "note-2" }),
        },
      ),
    ).resolves.toBe("note-1")
  })
})
