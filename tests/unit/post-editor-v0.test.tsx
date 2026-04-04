import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { PostEditor } from "@/components/admin/post-editor"
import type { PostEditorInput } from "@/lib/contracts/posts"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock("@/components/admin/v0-markdown-editor", () => ({
  V0MarkdownEditor: ({ value }: { value: string }) => createElement("textarea", { value, readOnly: true }),
}))

vi.mock("@/components/admin/tiptap-editor", () => ({
  TiptapEditor: () => createElement("div", null, "tiptap"),
}))

describe("v0 post editor", () => {
  it("exposes project summary and share-image language inside the unified assets workflow", () => {
    const initialPost: PostEditorInput = {
      id: "post_1",
      title: "Demo Project",
      slug: "demo-project",
      excerpt: "A real summary.",
      type: "PROJECT",
      status: "DRAFT",
      contentVersion: 1,
      contentMode: "block",
      markdownSource: "hello",
      htmlContent: "<p>hello</p>",
      content: { type: "doc", blocks: [] },
      tags: [],
      coverImageUrl: "https://cdn.example.com/cover.png",
      assets: [
        {
          id: "asset_1",
          kind: "IMAGE",
          originalName: "cover.png",
          mime: "image/png",
          size: 123,
          url: "https://cdn.example.com/cover.png",
          createdAt: "2026-04-04T12:00:00.000Z",
        },
        {
          id: "asset_2",
          kind: "IMAGE",
          originalName: "secondary.png",
          mime: "image/png",
          size: 456,
          url: "https://cdn.example.com/secondary.png",
          createdAt: "2026-04-04T12:01:00.000Z",
        },
      ],
      links: [],
    }

    const markup = renderToStaticMarkup(
      createElement(PostEditor, {
        initialPost,
        variant: "v0",
        showHeader: false,
        isDarkMode: true,
      }),
    )

    expect(markup).toContain("Summary")
    expect(markup).toContain('value="A real summary."')
    expect(markup).toContain("[set share image]")
    expect(markup).toContain("[share image]")
    expect(markup).not.toContain("[set cover]")
    expect(markup).toContain(".md,.csv,.json,.yml,.yaml,.xml,.log")
  })
})
