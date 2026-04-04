import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { DetailProjectScreen } from "@/components/v0/public/detail-project-screen"
import type { PostDetailDTO } from "@/lib/contracts/posts"

vi.mock("@/components/v0/public/public-shell", () => ({
  PublicShell: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
}))

vi.mock("@/components/v0/use-v0-theme-controller", () => ({
  useV0ThemeController: (isDarkMode: boolean) => ({
    isDarkMode,
    toggleTheme: vi.fn(),
  }),
}))

describe("detail project summary", () => {
  it("omits the summary line when excerpt is empty instead of rendering fixture prose", () => {
    const post: PostDetailDTO = {
      id: "project_1",
      slug: "demo-project",
      type: "PROJECT",
      status: "PUBLISHED",
      title: "Demo Project",
      excerpt: "",
      tags: [],
      views: 0,
      coverImageUrl: null,
      publishedAt: "2026-04-04T12:00:00.000Z",
      updatedAt: "2026-04-04T12:00:00.000Z",
      contentVersion: 1,
      contentMode: "block",
      markdownSource: "",
      htmlContent: "",
      content: { type: "doc", blocks: [] },
      links: [],
      assets: [],
      likeCount: 0,
      comments: [],
      commentsPagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    }

    const markup = renderToStaticMarkup(createElement(DetailProjectScreen, { isDarkMode: true, post }))

    expect(markup).toContain("Demo Project")
    expect(markup).not.toContain("A gamified life management app that turns daily tasks into XP and achievements")
  })
})
