import { inferLinkType, normalizeExternalUrl } from "@/lib/content/link-preview"
import { parsePreviewMetadata } from "@/lib/content/preview-metadata"

describe("link preview contracts", () => {
  it("normalizes bare domains to https", () => {
    expect(normalizeExternalUrl("example.com")).toBe("https://example.com/")
  })

  it("rejects credentials and non-standard ports", () => {
    expect(() => normalizeExternalUrl("https://user:pass@example.com")).toThrow(/credentials/i)
    expect(() => normalizeExternalUrl("https://example.com:8443")).toThrow(/80 and 443/i)
  })

  it("infers GitHub and YouTube link types", () => {
    expect(inferLinkType("https://github.com/openai/openai-node")).toBe("GITHUB")
    expect(inferLinkType("https://youtu.be/abc123")).toBe("YOUTUBE")
    expect(inferLinkType("https://example.com/docs")).toBe("WEBSITE")
  })

  it("parses typed preview metadata safely", () => {
    expect(
      parsePreviewMetadata({
        kind: "GITHUB",
        owner: "openai",
        repo: "openai-node",
        stars: 10,
        forks: 2,
        primaryLanguage: "TypeScript",
        openIssues: 3,
      }),
    ).toEqual({
      kind: "GITHUB",
      owner: "openai",
      repo: "openai-node",
      stars: 10,
      forks: 2,
      primaryLanguage: "TypeScript",
      openIssues: 3,
    })

    expect(parsePreviewMetadata({ kind: "GITHUB", owner: "openai" })).toBeNull()
  })
})
