import { buildStaticProfileBootstrap, buildStaticProfileSnapshot, PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import {
  buildLegacyContentDocument,
  collectBlockDocumentResources,
  POST_BLOCK_CONTENT_VERSION,
  resolvePostContentMode,
} from "@/lib/content/post-content"

describe("post content compatibility", () => {
  it("keeps legacy content on the legacy reader path", () => {
    expect(
      resolvePostContentMode({
        contentVersion: 1,
        markdownSource: null,
        content: buildLegacyContentDocument("Legacy", "<p>Hello</p>"),
      }),
    ).toBe("legacy")
  })

  it("treats markdown-backed content as block content", () => {
    expect(
      resolvePostContentMode({
        contentVersion: 1,
        markdownSource: "# Hello",
        content: buildLegacyContentDocument("Legacy", "<p>Hello</p>"),
      }),
    ).toBe("block")
  })

  it("treats canonical block documents as block content", () => {
    expect(
      resolvePostContentMode({
        contentVersion: POST_BLOCK_CONTENT_VERSION,
        markdownSource: null,
        content: { type: "doc", version: POST_BLOCK_CONTENT_VERSION, blocks: [] },
      }),
    ).toBe("block")
  })

  it("keeps legacy content on the legacy path even if the revision counter grows", () => {
    expect(
      resolvePostContentMode({
        contentVersion: POST_BLOCK_CONTENT_VERSION + 10,
        markdownSource: null,
        content: buildLegacyContentDocument("Legacy", "<p>Hello</p>"),
      }),
    ).toBe("legacy")
  })

  it("collects inline asset and link references from canonical block text", () => {
    expect(
      collectBlockDocumentResources({
        type: "doc",
        version: POST_BLOCK_CONTENT_VERSION,
        blocks: [
          {
            id: "block-1",
            type: "paragraph",
            text: "See [download](asset://asset-123) and [docs](https://example.com/docs).",
          },
          {
            id: "block-2",
            type: "list",
            style: "unordered",
            items: ["-ignored", "[more](https://example.com/more)"],
          },
          {
            id: "block-3",
            type: "image",
            assetId: "asset-456",
            url: "https://cdn.example.com/diagram.png",
          },
        ],
      }),
    ).toMatchObject({
      assetIds: expect.arrayContaining(["asset-123", "asset-456"]),
      linkUrls: expect.arrayContaining(["https://example.com/docs", "https://example.com/more"]),
      assetUrls: expect.arrayContaining(["https://cdn.example.com/diagram.png"]),
    })
  })

  it("collects inline link references from legacy content nodes", () => {
    expect(
      collectBlockDocumentResources({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Repository",
                marks: [{ type: "link", attrs: { href: "https://github.com/octocat/Hello-World" } }],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[download](asset://asset-legacy-123)",
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      linkUrls: expect.arrayContaining(["https://github.com/octocat/Hello-World"]),
      assetIds: expect.arrayContaining(["asset-legacy-123"]),
    })
  })
})

describe("profile bootstrap", () => {
  it("builds a primary profile bootstrap payload from the static profile fallback", () => {
    const bootstrap = buildStaticProfileBootstrap()

    expect(bootstrap.slug).toBe(PRIMARY_PROFILE_SLUG)
    expect(bootstrap.displayName).toBe("Jimin Park")
    expect(bootstrap.githubHref).toContain("github.com")
  })

  it("builds a static fallback snapshot for pre-bootstrap runtime safety", () => {
    const snapshot = buildStaticProfileSnapshot()

    expect(snapshot.displayName).toBe("Jimin Park")
    expect(snapshot.source).toBe("static-fallback")
    expect(snapshot.links.length).toBeGreaterThan(0)
  })
})
