import { describe, expect, it } from "vitest"

import {
  getDetailNoteNavigationState,
  mapFixtureNoteToNoteRow,
  mapPostCardToNoteRow,
} from "@/components/v0/public/mappers"

describe("note list row mapping", () => {
  it("maps live notes without the removed status symbol column", () => {
    const row = mapPostCardToNoteRow({
      id: "note-1",
      slug: "previous-note",
      type: "NOTE",
      status: "PUBLISHED",
      title: "Previous Note",
      excerpt: null,
      tags: ["AI", "Security"],
      views: 12,
      coverImageUrl: null,
      publishedAt: "2026-04-05T00:00:00.000Z",
      updatedAt: "2026-04-05T00:00:00.000Z",
    })

    expect(row).toEqual({
      id: "note-1",
      href: "/notes/previous-note",
      title: "Previous Note",
      date: "2026-04-05",
      tags: ["#AI", "#Security"],
      filterTags: ["#AI", "#Security"],
      views: 12,
    })
    expect("statusSymbol" in row).toBe(false)
  })

  it("maps fixture fallback rows without the removed status legend support", () => {
    const row = mapFixtureNoteToNoteRow({
      id: "fixture-1",
      title: "Fixture Note",
      date: "2026-04-01",
      tags: ["#AI"],
      views: 8,
    })

    expect(row).toEqual({
      id: "fixture-1",
      href: "#",
      title: "Fixture Note",
      date: "2026-04-01",
      tags: ["#AI"],
      filterTags: ["#AI"],
      views: 8,
    })
    expect("statusSymbol" in row).toBe(false)
  })
})

describe("detail note footer navigation state", () => {
  it("builds active previous and next links from note detail navigation data", () => {
    const navigation = getDetailNoteNavigationState({
      previousNote: {
        id: "note-prev",
        slug: "previous-note",
        title: "Previous Note",
      },
      nextNote: {
        id: "note-next",
        slug: "next-note",
        title: "Next Note",
      },
    })

    expect(navigation.previous).toEqual({
      label: "[< prev]",
      href: "/notes/previous-note",
      title: "Previous Note",
      disabled: false,
    })
    expect(navigation.next).toEqual({
      label: "[next >]",
      href: "/notes/next-note",
      title: "Next Note",
      disabled: false,
    })
  })

  it("keeps missing previous and next sides visible but disabled", () => {
    const navigation = getDetailNoteNavigationState({
      previousNote: null,
      nextNote: null,
    })

    expect(navigation.previous).toEqual({
      label: "[< prev]",
      href: null,
      title: null,
      disabled: true,
    })
    expect(navigation.next).toEqual({
      label: "[next >]",
      href: null,
      title: null,
      disabled: true,
    })
  })
})
