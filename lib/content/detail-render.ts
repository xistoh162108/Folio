export function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, "")
}

const HIGHLIGHT_KEYWORDS = new Set([
  "import",
  "from",
  "def",
  "return",
  "class",
  "if",
  "else",
  "for",
  "while",
  "try",
  "except",
  "with",
  "as",
  "in",
  "and",
  "or",
  "not",
  "True",
  "False",
  "None",
])

const HIGHLIGHT_BUILTINS = new Set(["np", "numpy", "math", "os", "sys"])
const HIGHLIGHT_TOKEN_REGEX =
  /#.*$|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\()|\b[a-zA-Z_][a-zA-Z0-9_]*\b/gm

export function syntaxHighlight(code: string, isDarkMode: boolean) {
  const accentClass = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const mutedClass = isDarkMode ? "text-white/35" : "text-black/40"
  let lastIndex = 0
  let highlighted = ""

  for (const match of code.matchAll(HIGHLIGHT_TOKEN_REGEX)) {
    const token = match[0] ?? ""
    const index = match.index ?? 0

    highlighted += escapeHtml(code.slice(lastIndex, index))

    if (token.startsWith("#")) {
      highlighted += `<span class="${mutedClass}">${escapeHtml(token)}</span>`
    } else if (/^["'`]/.test(token)) {
      highlighted += `<span class="${accentClass}">${escapeHtml(token)}</span>`
    } else if (/^\d/.test(token)) {
      highlighted += `<span class="${accentClass}">${escapeHtml(token)}</span>`
    } else if (
      HIGHLIGHT_KEYWORDS.has(token) ||
      HIGHLIGHT_BUILTINS.has(token) ||
      code[index + token.length] === "("
    ) {
      highlighted += `<span class="${accentClass}">${escapeHtml(token)}</span>`
    } else {
      highlighted += escapeHtml(token)
    }

    lastIndex = index + token.length
  }

  highlighted += escapeHtml(code.slice(lastIndex))
  return highlighted
}

function parseInlineHtml(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function extractTextBlocks(html: string) {
  return html
    .replace(/<(\/)?(ul|ol|li)[^>]*>/gi, "\n")
    .replace(/<(\/)?(p|div|section|article|blockquote|h1|h2|h3|h4|h5|h6)[^>]*>/gi, "\n\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^<h[1-6][^>]*>/i.test(block)) {
        return {
          type: "heading" as const,
          text: parseInlineHtml(block),
        }
      }

      if (/^<blockquote/i.test(block)) {
        return {
          type: "blockquote" as const,
          lines: parseInlineHtml(block)
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }
      }

      return {
        type: "paragraph" as const,
        html: parseInlineHtml(block),
      }
    })
}

export function extractFallbackBlocks(html: string) {
  const blocks: Array<
    | { type: "paragraph"; html: string }
    | { type: "heading"; text: string }
    | { type: "blockquote"; lines: string[] }
    | { type: "code"; language: string; code: string }
  > = []

  const codeRegex = /<pre[^>]*>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi
  let lastIndex = 0

  for (const match of html.matchAll(codeRegex)) {
    const [fullMatch, attributes = "", rawCode = ""] = match
    const matchIndex = match.index ?? 0
    const languageMatch =
      attributes.match(/class="[^"]*language-([^"\s]+)[^"]*"/i) ?? attributes.match(/data-language="([^"]+)"/i)
    const language = languageMatch?.[1] ?? ""
    const before = html.slice(lastIndex, matchIndex)
    blocks.push(...extractTextBlocks(before))
    blocks.push({
      type: "code",
      language,
      code: decodeHtml(stripHtmlTags(rawCode)),
    })
    lastIndex = matchIndex + fullMatch.length
  }

  blocks.push(...extractTextBlocks(html.slice(lastIndex)))
  return blocks
}
