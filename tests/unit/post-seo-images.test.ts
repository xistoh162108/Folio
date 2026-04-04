import { describe, expect, it } from "vitest"

import { getPostSeoImages } from "@/lib/seo/metadata"
import type { PostDetailDTO } from "@/lib/contracts/posts"

describe("post SEO images", () => {
  it("uses coverImageUrl as the authoritative share image when present", () => {
    const post: PostDetailDTO = {
      id: "project_1",
      slug: "demo-project",
      type: "PROJECT",
      status: "PUBLISHED",
      title: "Demo Project",
      excerpt: "Summary",
      tags: [],
      views: 0,
      coverImageUrl: "https://cdn.example.com/share.png",
      publishedAt: "2026-04-04T12:00:00.000Z",
      updatedAt: "2026-04-04T12:00:00.000Z",
      contentVersion: 1,
      contentMode: "block",
      markdownSource: "",
      htmlContent: "",
      content: { type: "doc", blocks: [] },
      links: [],
      assets: [
        {
          id: "asset_1",
          kind: "IMAGE",
          originalName: "fallback.png",
          mime: "image/png",
          size: 123,
          url: "https://cdn.example.com/fallback.png",
          createdAt: "2026-04-04T12:00:00.000Z",
        },
      ],
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

    expect(getPostSeoImages(post)).toEqual(["https://cdn.example.com/share.png"])
  })
})
