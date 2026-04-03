import {
  CANONICAL_MARKDOWN_FEATURES,
  buildBlockDocumentFromMarkdown,
  buildMarkdownWriterPayload,
  deriveMarkdownSource,
  renderBlockDocumentToHtml,
  serializeBlockDocumentToMarkdown,
} from "@/lib/content/markdown-blocks"
import { collectBlockDocumentResources } from "@/lib/content/post-content"
import { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"

describe("markdown block writer", () => {
  it("declares and enforces canonical markdown features", () => {
    expect(CANONICAL_MARKDOWN_FEATURES).toEqual(["code", "math", "links", "assets", "embeds"])
  })

  it("builds canonical blocks and derived html from markdown", () => {
    const payload = buildMarkdownWriterPayload(`# Title

paragraph with $x^2$ and [link](https://example.com)

- first
- second

$$
E = mc^2
$$

https://github.com/openai/openai

![Cover](https://example.com/cover.png "caption")
`)

    expect(payload.contentVersion).toBe(POST_BLOCK_CONTENT_VERSION)
    expect(payload.content.type).toBe("doc")
    expect(payload.content.blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "math",
      "embed",
      "image",
    ])
    expect(payload.htmlContent).toContain("<h1>")
    expect(payload.htmlContent).toContain('data-math-inline="true"')
    expect(payload.htmlContent).toContain('data-math-block="true"')
    expect(payload.htmlContent).toContain('data-provider="github"')
    expect(payload.htmlContent).toContain("<figure data-block=\"image\">")
  })

  it("derives markdown from legacy tiptap-style content when markdownSource is missing", () => {
    const derived = deriveMarkdownSource({
      markdownSource: "",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hello" }] },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Legacy body" }],
          },
        ],
      },
      htmlContent: "",
      title: "Legacy title",
    })

    expect(derived).toContain("## Hello")
    expect(derived).toContain("Legacy body")
  })

  it("supports standalone url embeds in block documents", () => {
    const doc = buildBlockDocumentFromMarkdown("https://youtu.be/dQw4w9WgXcQ")

    expect(doc.blocks).toHaveLength(1)
    expect(doc.blocks[0]).toMatchObject({
      type: "embed",
      provider: "YOUTUBE",
    })
  })

  it("normalizes asset protocol images and file links while resolving derived html", () => {
    const payload = buildMarkdownWriterPayload(
      `![Diagram](asset://image-asset "caption")

[Download](asset://file-asset)`,
      [
        { id: "image-asset", kind: "IMAGE", url: "https://cdn.example.com/diagram.png" },
        { id: "file-asset", kind: "FILE", url: "https://cdn.example.com/download.pdf" },
      ],
    )

    expect(payload.content.blocks[0]).toMatchObject({
      type: "image",
      assetId: "image-asset",
      url: "https://cdn.example.com/diagram.png",
      caption: "caption",
    })
    expect(payload.htmlContent).toContain('src="https://cdn.example.com/diagram.png"')
    expect(payload.htmlContent).toContain('href="/api/files/file-asset"')
  })

  it("round-trips canonical markdown for code/math/links/assets/embeds", () => {
    const markdown = `Paragraph with [docs](https://example.com/docs), [download](asset://file-asset), and $x^2$.

![Diagram](asset://image-asset "diagram")

\`\`\`ts
const x = 1
\`\`\`

$$
x^2 + y^2
$$

https://youtu.be/dQw4w9WgXcQ`
    const assets = [
      { id: "image-asset", kind: "IMAGE", url: "https://cdn.example.com/diagram.png" },
      { id: "file-asset", kind: "FILE", url: "https://cdn.example.com/file.pdf" },
    ]

    const document = buildBlockDocumentFromMarkdown(markdown, assets)
    const serialized = serializeBlockDocumentToMarkdown(document)
    const reparsed = buildBlockDocumentFromMarkdown(serialized, assets)

    expect(reparsed).toEqual(document)
  })

  it("keeps public html renderer output equivalent to serialized block content resources", () => {
    const payload = buildMarkdownWriterPayload(
      `Paragraph with [docs](https://example.com/docs), [download](asset://file-asset), and $x^2$.

![Diagram](asset://image-asset "diagram")

\`\`\`ts
const x = 1
\`\`\`

$$
x^2 + y^2
$$

https://youtu.be/dQw4w9WgXcQ`,
      [
        { id: "image-asset", kind: "IMAGE", url: "https://cdn.example.com/diagram.png" },
        { id: "file-asset", kind: "FILE", url: "https://cdn.example.com/file.pdf" },
      ],
    )
    const serializedResources = collectBlockDocumentResources(payload.content)
    const rendered = renderBlockDocumentToHtml(payload.content, [
      { id: "image-asset", kind: "IMAGE", url: "https://cdn.example.com/diagram.png" },
      { id: "file-asset", kind: "FILE", url: "https://cdn.example.com/file.pdf" },
    ])

    expect(rendered).toContain("<pre")
    expect(rendered).toContain('data-math-block="true"')
    expect(rendered).toContain("<code>x^2 + y^2</code>")
    expect(rendered).toContain('href="https://example.com/docs"')
    expect(rendered).toContain('href="/api/files/file-asset"')
    expect(rendered).toContain('src="https://cdn.example.com/diagram.png"')
    expect(rendered).toContain('data-provider="youtube"')
    expect(serializedResources.linkUrls).toEqual(expect.arrayContaining(["https://example.com/docs", "https://youtu.be/dQw4w9WgXcQ"]))
    expect(serializedResources.assetIds).toEqual(expect.arrayContaining(["file-asset", "image-asset"]))
  })
})
