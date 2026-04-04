import { describe, expect, it } from "vitest"

import { formatDetailMetaLine } from "@/components/v0/public/mappers"
import type { PostDetailDTO } from "@/lib/contracts/posts"

describe("detail meta line", () => {
  it("formats project detail metadata using the same date/read-time grammar as notes", () => {
    const post: PostDetailDTO = {
      id: "project_meta",
      slug: "project-meta",
      type: "PROJECT",
      status: "PUBLISHED",
      title: "Project Meta",
      excerpt: "summary",
      tags: [],
      views: 12,
      coverImageUrl: null,
      publishedAt: "2026-04-04T12:00:00.000Z",
      updatedAt: "2026-04-04T12:00:00.000Z",
      contentVersion: 1,
      contentMode: "block",
      markdownSource: "",
      htmlContent: "<p>hello world from xistoh project detail metadata</p>",
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

    expect(formatDetailMetaLine(post)).toBe("// 2026-04-04 - 1 min read")
  })
})
