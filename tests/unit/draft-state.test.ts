import { isEffectivelyEmptyDraft } from "@/lib/content/draft-state"

describe("isEffectivelyEmptyDraft", () => {
  it("treats untitled drafts with empty content as empty", () => {
    expect(
      isEffectivelyEmptyDraft({
        status: "DRAFT",
        title: "Untitled draft",
        excerpt: "",
        coverImageUrl: "",
        activeLinkCount: 0,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "   " }] }],
        },
      }),
    ).toBe(true)
  })

  it("treats meaningful text as non-empty", () => {
    expect(
      isEffectivelyEmptyDraft({
        status: "DRAFT",
        title: "Untitled draft",
        excerpt: "",
        coverImageUrl: "",
        activeLinkCount: 0,
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "hello world" }] }],
        },
      }),
    ).toBe(false)
  })

  it("ignores asset-only drafts and keeps them eligible for cleanup", () => {
    expect(
      isEffectivelyEmptyDraft({
        status: "DRAFT",
        title: "Untitled draft",
        excerpt: "",
        coverImageUrl: "",
        activeLinkCount: 0,
        content: {
          type: "doc",
          content: [{ type: "image", attrs: { src: "https://example.com/example.png" } }],
        },
      }),
    ).toBe(true)
  })

  it("treats active links as meaningful content", () => {
    expect(
      isEffectivelyEmptyDraft({
        status: "DRAFT",
        title: "Untitled draft",
        excerpt: "",
        coverImageUrl: "",
        activeLinkCount: 1,
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
      }),
    ).toBe(false)
  })
})
