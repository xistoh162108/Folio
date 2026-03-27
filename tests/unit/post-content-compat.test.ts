import { buildStaticProfileBootstrap, buildStaticProfileSnapshot, PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import { buildLegacyContentDocument, POST_BLOCK_CONTENT_VERSION, resolvePostContentMode } from "@/lib/content/post-content"

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
