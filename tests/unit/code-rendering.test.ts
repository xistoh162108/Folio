import { normalizeCodeForDetailRendering, renderHighlightedCodeHtml } from "@/lib/content/code-rendering"

describe("detail code rendering", () => {
  it("preserves plain block-derived code while escaping html", () => {
    const normalized = normalizeCodeForDetailRendering('if (x < 2) { return "<tag>" }')
    const highlighted = renderHighlightedCodeHtml(normalized, true)

    expect(normalized).toContain('<tag>')
    expect(highlighted).toContain("&lt;tag&gt;")
    expect(highlighted).toContain('<span class="text-[#D4FF00]">if</span>')
  })

  it("strips known syntax-highlighter wrappers from markdown-derived code", () => {
    const markdownDerived =
      '&lt;span class="hljs-keyword"&gt;return&lt;/span&gt; &lt;span class="token string"&gt;"ok"&lt;/span&gt;'

    const normalized = normalizeCodeForDetailRendering(markdownDerived)
    const highlighted = renderHighlightedCodeHtml(markdownDerived, false)

    expect(normalized).toBe('return "ok"')
    expect(highlighted).not.toContain("hljs-keyword")
    expect(highlighted).not.toContain("token string")
    expect(highlighted).toContain('<span class="text-[#3F5200]">return</span>')
  })
})
