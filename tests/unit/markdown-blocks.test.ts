import { buildBlockDocumentFromMarkdown, buildMarkdownWriterPayload, deriveMarkdownSource } from "@/lib/content/markdown-blocks"
import { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"

describe("markdown block writer", () => {
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
})
