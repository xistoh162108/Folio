import { describe, expect, it } from "vitest"

import { extractFallbackBlocks, syntaxHighlight } from "@/lib/content/detail-render"

function decodeEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

describe("detail content code rendering", () => {
  it("preserves the visible source text after syntax highlighting", () => {
    const code = 'print("hello world!")\n# keep math: x^2'
    const highlighted = syntaxHighlight(code, false)
    const visibleText = decodeEntities(highlighted.replace(/<[^>]+>/g, ""))

    expect(visibleText).toBe(code)
    expect(visibleText).not.toContain('text-[#3F5200]')
  })

  it("normalizes fallback code blocks that still contain old span markup", () => {
    const blocks = extractFallbackBlocks(
      '<pre><code><span class="text-[#3F5200]">print</span>(&quot;hello world!&quot;)</code></pre>',
    )

    expect(blocks).toEqual([
      {
        type: "code",
        language: "",
        code: 'print("hello world!")',
      },
    ])
  })
})
