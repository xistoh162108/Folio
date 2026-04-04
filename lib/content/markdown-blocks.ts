import type { BlockDocument, ContentBlock, EmbedBlock, ImageBlock } from "@/lib/contracts/content-blocks"
import { renderBlockMathHtml, renderInlineMathHtml } from "@/lib/content/math-render"
import { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"

const STANDALONE_URL_RE = /^https?:\/\/\S+$/i
const MARKDOWN_TARGET_RE = /(?:asset:\/\/[A-Za-z0-9-]+|https?:\/\/[^\s)]+)/i
const IMAGE_RE = new RegExp(`^!\\[(.*?)\\]\\((${MARKDOWN_TARGET_RE.source})(?:\\s+"([^"]*)")?\\)$`, "i")
const HEADING_RE = /^(#{1,6})\s+(.*)$/
const ORDERED_LIST_RE = /^\d+[.)]\s+(.*)$/
const UNORDERED_LIST_RE = /^[-*]\s+(.*)$/

interface MarkdownWriterAsset {
  id: string
  kind?: string | null
  url?: string | null
}

function normalizeMarkdownSource(source: string) {
  return source.replace(/\r\n?/g, "\n")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
}

function toAssetProtocolUrl(assetId: string) {
  return `asset://${assetId}`
}

function parseAssetProtocolUrl(value: string) {
  const match = value.trim().match(/^asset:\/\/([A-Za-z0-9-]+)$/)
  return match?.[1] ?? null
}

function resolveMarkdownHref(target: string, assets: MarkdownWriterAsset[] = []) {
  const assetId = parseAssetProtocolUrl(target)
  if (!assetId) {
    return target
  }

  const asset = assets.find((candidate) => candidate.id === assetId)
  if (!asset) {
    return target
  }

  if (asset.kind === "FILE") {
    return `/api/files/${assetId}`
  }

  return asset.url ?? target
}

function isBlockBoundary(line: string) {
  const trimmed = line.trim()

  return (
    trimmed === "" ||
    trimmed === "---" ||
    trimmed === "***" ||
    trimmed === "$$" ||
    trimmed.startsWith("```") ||
    HEADING_RE.test(line) ||
    line.startsWith("> ") ||
    line.startsWith(">") ||
    ORDERED_LIST_RE.test(line) ||
    UNORDERED_LIST_RE.test(line) ||
    IMAGE_RE.test(trimmed) ||
    STANDALONE_URL_RE.test(trimmed)
  )
}

function inferEmbedProvider(url: string): EmbedBlock["provider"] {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, "")

    if (hostname === "youtube.com" || hostname === "youtu.be") {
      return "YOUTUBE"
    }

    if (hostname === "github.com") {
      return "GITHUB"
    }
  } catch {
    return "GENERIC"
  }

  return "GENERIC"
}

export function renderInlineMarkdownHtml(text: string, assets: MarkdownWriterAsset[] = []) {
  const mathTokens: string[] = []
  const sourceWithMathTokens = text.replace(/\$([^$\n]+)\$/g, (_match, value: string) => {
    const token = `@@V0_MATH_${mathTokens.length}@@`
    mathTokens.push(renderInlineMathHtml(value))
    return token
  })
  const escaped = escapeHtml(sourceWithMathTokens)
  const rendered = escaped
    .replace(
      /\[([^\]]+)\]\(((?:asset:\/\/[A-Za-z0-9-]+|https?:\/\/[^\s)]+))\)/g,
      (_match, label: string, url: string) => {
        const resolvedHref = resolveMarkdownHref(url, assets)
        return `<a href="${escapeAttribute(resolvedHref)}" target="_blank" rel="noreferrer noopener">${escapeHtml(label)}</a>`
      },
    )
    .replace(/`([^`]+)`/g, (_match, code: string) => `<code>${escapeHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, (_match, value: string) => `<strong>${escapeHtml(value)}</strong>`)
    .replace(/\*([^*\n]+)\*/g, (_match, value: string) => `<em>${escapeHtml(value)}</em>`)
    .replace(/\n/g, "<br />")

  return mathTokens.reduce((current, html, index) => current.replace(`@@V0_MATH_${index}@@`, html), rendered)
}

function blockId(index: number) {
  return `block-${index + 1}`
}

function buildParagraphBlock(text: string, index: number): ContentBlock {
  return {
    id: blockId(index),
    type: "paragraph",
    text,
  }
}

function serializeLegacyInline(node: unknown): string {
  if (!node || typeof node !== "object") {
    return ""
  }

  const candidate = node as {
    type?: unknown
    text?: unknown
    marks?: unknown
    attrs?: unknown
    content?: unknown
  }

  if (candidate.type === "text") {
    let value = typeof candidate.text === "string" ? candidate.text : ""

    if (Array.isArray(candidate.marks)) {
      for (const mark of candidate.marks as Array<{ type?: string; attrs?: { href?: string } }>) {
        if (mark.type === "code") value = `\`${value}\``
        if (mark.type === "bold") value = `**${value}**`
        if (mark.type === "italic") value = `*${value}*`
        if (mark.type === "link" && typeof mark.attrs?.href === "string") value = `[${value}](${mark.attrs.href})`
      }
    }

    return value
  }

  if (candidate.type === "hardBreak") {
    return "\n"
  }

  if (Array.isArray(candidate.content)) {
    return candidate.content.map((child) => serializeLegacyInline(child)).join("")
  }

  return ""
}

function serializeLegacyNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return ""
  }

  const candidate = node as {
    type?: unknown
    attrs?: { level?: number; language?: string }
    content?: unknown
  }

  const children = Array.isArray(candidate.content) ? candidate.content : []

  switch (candidate.type) {
    case "paragraph":
      return serializeLegacyInline(candidate).trim()
    case "heading": {
      const level = Math.max(1, Math.min(6, Number(candidate.attrs?.level ?? 1)))
      return `${"#".repeat(level)} ${serializeLegacyInline(candidate).trim()}`
    }
    case "blockquote": {
      const text = children.map((child) => serializeLegacyNode(child)).filter(Boolean).join("\n")
      return text
        .split("\n")
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join("\n")
    }
    case "bulletList":
      return children
        .map((child) => `- ${serializeLegacyInline(child).trim()}`)
        .join("\n")
    case "orderedList":
      return children
        .map((child, index) => `${index + 1}. ${serializeLegacyInline(child).trim()}`)
        .join("\n")
    case "listItem":
      return children.map((child) => serializeLegacyNode(child)).filter(Boolean).join(" ").trim()
    case "codeBlock": {
      const language = candidate.attrs?.language ? String(candidate.attrs.language) : ""
      return `\`\`\`${language}\n${serializeLegacyInline(candidate)}\n\`\`\``
    }
    case "horizontalRule":
      return "---"
    default:
      return children.map((child) => serializeLegacyNode(child)).filter(Boolean).join("\n").trim()
  }
}

function serializeBlockDocumentToMarkdown(content: BlockDocument) {
  return content.blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `${"#".repeat(block.level)} ${block.text}`
        case "paragraph":
          return block.text
        case "quote":
          return block.text
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n")
        case "list":
          return block.items
            .map((item, index) => (block.style === "ordered" ? `${index + 1}. ${item}` : `- ${item}`))
            .join("\n")
        case "code":
          return `\`\`\`${block.language ?? ""}\n${block.code}\n\`\`\``
        case "math":
          return block.variant === "block" ? `$$\n${block.expression}\n$$` : `$${block.expression}$`
        case "image":
          return `![${block.alt ?? ""}](${block.assetId ? toAssetProtocolUrl(block.assetId) : block.url ?? ""}${block.caption ? ` "${block.caption}"` : ""})`
        case "embed":
          return block.url
        case "thematicBreak":
          return "---"
      }
    })
    .join("\n\n")
    .trim()
}

export function deriveMarkdownSource(input: {
  markdownSource?: string | null
  content?: unknown
  htmlContent?: string
  excerpt?: string | null
  title?: string | null
}) {
  if (typeof input.markdownSource === "string" && input.markdownSource.trim().length > 0) {
    return normalizeMarkdownSource(input.markdownSource)
  }

  if (input.content && typeof input.content === "object") {
    if ("blocks" in (input.content as Record<string, unknown>) && Array.isArray((input.content as { blocks?: unknown }).blocks)) {
      return serializeBlockDocumentToMarkdown(input.content as BlockDocument)
    }

    if ("content" in (input.content as Record<string, unknown>) && Array.isArray((input.content as { content?: unknown }).content)) {
      const lines = ((input.content as { content?: unknown[] }).content ?? [])
        .map((node) => serializeLegacyNode(node))
        .filter((value) => value.trim().length > 0)
      if (lines.length > 0) {
        return normalizeMarkdownSource(lines.join("\n\n"))
      }
    }
  }

  if (typeof input.htmlContent === "string" && input.htmlContent.trim().length > 0) {
    const plain = input.htmlContent
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    if (plain.length > 0) {
      return normalizeMarkdownSource(plain)
    }
  }

  return normalizeMarkdownSource(input.excerpt?.trim() || "")
}

export function buildBlockDocumentFromMarkdown(markdownSource: string, assets: MarkdownWriterAsset[] = []): BlockDocument {
  const source = normalizeMarkdownSource(markdownSource).trim()
  const lines = source.length > 0 ? source.split("\n") : []
  const blocks: ContentBlock[] = []
  let index = 0
  let cursor = 0

  while (cursor < lines.length) {
    const line = lines[cursor] ?? ""
    const trimmed = line.trim()

    if (trimmed.length === 0) {
      cursor += 1
      continue
    }

    if (trimmed === "---" || trimmed === "***") {
      blocks.push({ id: blockId(index++), type: "thematicBreak" })
      cursor += 1
      continue
    }

    if (trimmed === "$$") {
      const mathLines: string[] = []
      cursor += 1

      while (cursor < lines.length && lines[cursor]?.trim() !== "$$") {
        mathLines.push(lines[cursor] ?? "")
        cursor += 1
      }

      if (cursor < lines.length && lines[cursor]?.trim() === "$$") {
        cursor += 1
      }

      blocks.push({
        id: blockId(index++),
        type: "math",
        variant: "block",
        expression: mathLines.join("\n").trim(),
      })
      continue
    }

    const singleLineBlockMath = trimmed.match(/^\$\$(.+)\$\$$/)
    if (singleLineBlockMath) {
      blocks.push({
        id: blockId(index++),
        type: "math",
        variant: "block",
        expression: singleLineBlockMath[1]?.trim() ?? "",
      })
      cursor += 1
      continue
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || null
      const codeLines: string[] = []
      cursor += 1

      while (cursor < lines.length && !lines[cursor]?.trim().startsWith("```")) {
        codeLines.push(lines[cursor] ?? "")
        cursor += 1
      }

      if (cursor < lines.length && lines[cursor]?.trim().startsWith("```")) {
        cursor += 1
      }

      blocks.push({
        id: blockId(index++),
        type: "code",
        language,
        code: codeLines.join("\n"),
      })
      continue
    }

    const heading = line.match(HEADING_RE)
    if (heading) {
      blocks.push({
        id: blockId(index++),
        type: "heading",
        level: Math.min(heading[1]?.length ?? 1, 6) as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2]?.trim() ?? "",
      })
      cursor += 1
      continue
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = []

      while (cursor < lines.length && (lines[cursor] ?? "").startsWith(">")) {
        quoteLines.push((lines[cursor] ?? "").replace(/^>\s?/, ""))
        cursor += 1
      }

      blocks.push({
        id: blockId(index++),
        type: "quote",
        text: quoteLines.join("\n").trim(),
      })
      continue
    }

    if (ORDERED_LIST_RE.test(line) || UNORDERED_LIST_RE.test(line)) {
      const ordered = ORDERED_LIST_RE.test(line)
      const items: string[] = []

      while (cursor < lines.length) {
        const current = lines[cursor] ?? ""
        const matched = ordered ? current.match(ORDERED_LIST_RE) : current.match(UNORDERED_LIST_RE)
        if (!matched) {
          break
        }
        items.push((matched[1] ?? "").trim())
        cursor += 1
      }

      blocks.push({
        id: blockId(index++),
        type: "list",
        style: ordered ? "ordered" : "unordered",
        items,
      })
      continue
    }

    const image = trimmed.match(IMAGE_RE)
    if (image) {
      const [, alt = "", url = "", caption = ""] = image
      const assetId = parseAssetProtocolUrl(url)
      blocks.push({
        id: blockId(index++),
        type: "image",
        assetId,
        alt: alt || null,
        url: assetId ? resolveMarkdownHref(url, assets) : url,
        caption: caption || null,
      } satisfies ImageBlock)
      cursor += 1
      continue
    }

    if (STANDALONE_URL_RE.test(trimmed)) {
      blocks.push({
        id: blockId(index++),
        type: "embed",
        url: trimmed,
        provider: inferEmbedProvider(trimmed),
      })
      cursor += 1
      continue
    }

    const paragraphLines: string[] = []
    while (cursor < lines.length) {
      const current = lines[cursor] ?? ""
      if (current.trim().length === 0) {
        break
      }
      if (paragraphLines.length > 0 && isBlockBoundary(current)) {
        break
      }
      paragraphLines.push(current)
      cursor += 1
    }

    blocks.push(buildParagraphBlock(paragraphLines.join("\n").trim(), index++))
  }

  return {
    type: "doc",
    version: POST_BLOCK_CONTENT_VERSION,
    blocks,
  }
}

export function renderBlockDocumentToHtml(document: BlockDocument, assets: MarkdownWriterAsset[] = []) {
  return document.blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h${block.level}>${renderInlineMarkdownHtml(block.text, assets)}</h${block.level}>`
        case "paragraph":
          return `<p>${renderInlineMarkdownHtml(block.text, assets)}</p>`
        case "quote":
          return `<blockquote><p>${renderInlineMarkdownHtml(block.text, assets)}</p></blockquote>`
        case "list": {
          const tag = block.style === "ordered" ? "ol" : "ul"
          return `<${tag}>${block.items.map((item) => `<li>${renderInlineMarkdownHtml(item, assets)}</li>`).join("")}</${tag}>`
        }
        case "code":
          return `<pre><code${
            block.language
              ? ` class="language-${escapeAttribute(block.language)}" data-language="${escapeAttribute(block.language)}"`
              : ""
          }>${escapeHtml(block.code)}</code></pre>`
        case "math":
          return block.variant === "block" ? renderBlockMathHtml(block.expression) : renderInlineMathHtml(block.expression)
        case "image":
          return `<figure data-block="image"><img src="${escapeAttribute(block.url ?? (block.assetId ? resolveMarkdownHref(toAssetProtocolUrl(block.assetId), assets) : ""))}" alt="${escapeAttribute(block.alt ?? "")}" />${
            block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""
          }</figure>`
        case "embed":
          return `<figure data-block="embed" data-provider="${block.provider.toLowerCase()}"><a href="${escapeAttribute(block.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(block.label ?? block.url)}</a></figure>`
        case "thematicBreak":
          return "<hr />"
      }
    })
    .join("\n")
}

export function buildMarkdownWriterPayload(markdownSource: string, assets: MarkdownWriterAsset[] = []) {
  const normalized = normalizeMarkdownSource(markdownSource)
  const content = buildBlockDocumentFromMarkdown(normalized, assets)
  return {
    markdownSource: normalized,
    content,
    htmlContent: renderBlockDocumentToHtml(content, assets),
    contentVersion: POST_BLOCK_CONTENT_VERSION,
  }
}
