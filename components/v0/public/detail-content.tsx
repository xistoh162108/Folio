"use client"

import { useMemo, useState } from "react"

import { renderInlineMarkdownHtml } from "@/lib/content/markdown-blocks"
import { isBlockDocument } from "@/lib/content/post-content"
import type { ContentBlock, EmbedBlock, ImageBlock } from "@/lib/contracts/content-blocks"
import type { PostAssetDTO, PostLinkDTO } from "@/lib/contracts/posts"

type ContentMark = {
  type?: string
  attrs?: Record<string, unknown>
}

type ContentNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: ContentMark[]
  content?: ContentNode[]
}

function decodeHtml(value: string) {
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

function getPlainText(nodes: ContentNode[] = []): string {
  return nodes
    .map((node) => {
      if (typeof node.text === "string") {
        return node.text
      }

      if (Array.isArray(node.content)) {
        return getPlainText(node.content)
      }

      return ""
    })
    .join("")
}

function parseInlineHtml(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function syntaxHighlight(code: string, isDarkMode: boolean) {
  const accentClass = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const mutedClass = isDarkMode ? "text-white/35" : "text-black/40"
  return escapeHtml(code)
    .replace(
      /\b(import|from|def|return|class|if|else|for|while|try|except|with|as|in|and|or|not|True|False|None)\b/g,
      `<span class="${accentClass}">$1</span>`,
    )
    .replace(
      /\b(np|numpy|math|os|sys)\b/g,
      `<span class="${accentClass}">$1</span>`,
    )
    .replace(
      /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
      `<span class="${accentClass}">$1</span>`,
    )
    .replace(
      /(["'])(.*?)\1/g,
      `<span class="${accentClass}">$1$2$1</span>`,
    )
    .replace(
      /#.*$/gm,
      `<span class="${mutedClass}">$&</span>`,
    )
    .replace(
      /\b(\d+\.?\d*)\b/g,
      `<span class="${accentClass}">$1</span>`,
    )
}

function applyMarks(content: string, marks: ContentMark[] | undefined, isDarkMode: boolean): string {
  if (!marks?.length) {
    return escapeHtml(content)
  }

  return marks.reduce((current, mark) => {
    switch (mark.type) {
      case "bold":
        return `<strong class="${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}">${current}</strong>`
      case "italic":
        return `<em>${current}</em>`
      case "strike":
        return `<s>${current}</s>`
      case "code":
        return `<code class="px-1.5 py-0.5 text-xs ${
          isDarkMode ? "bg-[#1a1a1a] text-[#7aa2f7]" : "bg-gray-100 text-blue-700"
        }">${current}</code>`
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#"
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer" class="${
          isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
        } underline underline-offset-4">${current}</a>`
      }
      default:
        return current
    }
  }, escapeHtml(content))
}

function renderInlineHtml(nodes: ContentNode[] = [], isDarkMode: boolean): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") {
        return "<br />"
      }

      if (typeof node.text === "string") {
        return applyMarks(node.text, node.marks, isDarkMode)
      }

      if (Array.isArray(node.content)) {
        return applyMarks(renderInlineHtml(node.content, isDarkMode), node.marks, isDarkMode)
      }

      return ""
    })
    .join("")
}

function extractFallbackBlocks(html: string) {
  const blocks: Array<
    | { type: "paragraph"; html: string }
    | { type: "heading"; text: string }
    | { type: "blockquote"; lines: string[] }
    | { type: "code"; language: string; code: string }
  > = []

  const codeRegex = /<pre[^>]*>\s*<code(?: class="language-([^"]+)")?[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi
  let lastIndex = 0

  for (const match of html.matchAll(codeRegex)) {
    const [fullMatch, language = "", rawCode = ""] = match
    const matchIndex = match.index ?? 0
    const before = html.slice(lastIndex, matchIndex)
    blocks.push(...extractTextBlocks(before))
    blocks.push({
      type: "code",
      language,
      code: decodeHtml(rawCode),
    })
    lastIndex = matchIndex + fullMatch.length
  }

  blocks.push(...extractTextBlocks(html.slice(lastIndex)))
  return blocks
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

function normalizeLinkKey(url: string) {
  try {
    const parsed = new URL(url.trim())
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

function extractYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, "")

    if (hostname === "youtu.be") {
      return parsed.pathname.replace("/", "") || null
    }

    if (hostname === "youtube.com") {
      return parsed.searchParams.get("v")
    }
  } catch {
    return null
  }

  return null
}

function resolveYouTubeEmbedUrl(url: string, fallback?: string | null) {
  if (fallback?.trim()) {
    return fallback
  }

  const videoId = extractYouTubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

function resolveYouTubeThumbnailUrl(url: string, fallback?: string | null) {
  if (fallback?.trim()) {
    return fallback
  }

  const videoId = extractYouTubeVideoId(url)
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
}

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function formatGitHubKind(url: string) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean)
    if (parts.length >= 4 && parts[2] === "issues") {
      return `[issue #${parts[3]}]`
    }
    if (parts.length >= 4 && parts[2] === "pull") {
      return `[pr #${parts[3]}]`
    }
  } catch {
    return "[repo]"
  }

  return "[repo]"
}

function resolveLink(url: string, links: PostLinkDTO[]) {
  const normalized = normalizeLinkKey(url)

  return (
    links.find((link) => normalizeLinkKey(link.normalizedUrl ?? link.url) === normalized) ??
    links.find((link) => normalizeLinkKey(link.url) === normalized) ??
    null
  )
}

function resolveImageAsset(block: ImageBlock, assets: PostAssetDTO[]) {
  if (block.assetId) {
    return assets.find((asset) => asset.id === block.assetId) ?? null
  }

  if (block.url) {
    return assets.find((asset) => asset.url === block.url) ?? null
  }

  return null
}

function hasLegacyNodes(content: unknown): content is { content: ContentNode[] } {
  return typeof content === "object" && content !== null && "content" in content && Array.isArray((content as { content?: unknown }).content)
}

export function hasRenderableDetailContent(input: { content?: unknown; fallbackHtml?: string | null }) {
  if (isBlockDocument(input.content)) {
    return input.content.blocks.length > 0
  }

  if (hasLegacyNodes(input.content)) {
    return input.content.content.length > 0
  }

  return Boolean(input.fallbackHtml?.trim())
}

function DetailCodeBlock({
  code,
  language,
  index,
  copiedCode,
  onCopy,
  isDarkMode,
  borderColor,
  hoverBg,
  mutedText,
}: {
  code: string
  language?: string | null
  index: number
  copiedCode: number | null
  onCopy: (code: string, index: number) => Promise<void>
  isDarkMode: boolean
  borderColor: string
  hoverBg: string
  mutedText: string
}) {
  const highlightedCode = syntaxHighlight(code, isDarkMode)

  return (
    <div className="relative group">
      <div className={`flex items-center justify-between border-t border-x px-4 py-2 ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
        <span className={`text-xs ${mutedText}`}>// {language ?? ""}</span>
        <button
          type="button"
          onClick={() => void onCopy(code, index)}
          className={`px-2 py-0.5 text-xs transition-colors ${hoverBg} ${
            copiedCode === index ? (isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]") : mutedText
          }`}
        >
          {copiedCode === index ? "[copied]" : "[y]"}
        </button>
      </div>
      <pre className={`overflow-x-auto border p-4 text-xs ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
    </div>
  )
}

function DetailEmbedBlock({
  block,
  link,
  expanded,
  onToggle,
  borderColor,
  hoverBg,
  mutedText,
}: {
  block: EmbedBlock
  link: PostLinkDTO | null
  expanded: boolean
  onToggle: () => void
  borderColor: string
  hoverBg: string
  mutedText: string
}) {
  const title = link?.title ?? link?.label ?? block.label ?? block.url
  const description = link?.description ?? null
  const domain = link?.siteName ?? formatHost(link?.url ?? block.url)

  if (block.provider === "YOUTUBE") {
    const embedUrl = resolveYouTubeEmbedUrl(block.url, link?.embedUrl)
    const thumbnailUrl = resolveYouTubeThumbnailUrl(block.url, link?.imageUrl)

    return (
      <div className={`space-y-3 border p-4 ${borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`w-24 shrink-0 overflow-hidden border ${borderColor}`}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={title} className="h-16 w-full object-cover" />
            ) : (
              <div className={`flex h-16 items-center justify-center text-xs ${mutedText}`}>YT</div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm">{title}</p>
            <p className={`text-xs ${mutedText}`}>{domain}</p>
            {description ? <p className={`text-xs ${mutedText}`}>{description}</p> : null}
            <div className="flex flex-wrap gap-3 text-xs">
              {embedUrl ? (
                <button type="button" onClick={onToggle} className={`${hoverBg} px-2 py-1`}>
                  {expanded ? "[collapse]" : "[expand]"}
                </button>
              ) : null}
              <a href={block.url} target="_blank" rel="noreferrer" className={`${hoverBg} px-2 py-1`}>
                [open]
              </a>
            </div>
          </div>
        </div>
        {expanded && embedUrl ? (
          <div className={`overflow-hidden border ${borderColor}`}>
            <iframe
              src={embedUrl}
              title={title}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : null}
      </div>
    )
  }

  if (block.provider === "GITHUB") {
    const metadata = link?.metadata?.kind === "GITHUB" ? link.metadata : null
    return (
      <a href={block.url} target="_blank" rel="noreferrer" className={`block border p-4 transition-colors ${borderColor} ${hoverBg}`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className={mutedText}>// github</span>
            <span className={mutedText}>{formatGitHubKind(block.url)}</span>
          </div>
          <p className="text-sm">{title}</p>
          {description ? <p className={`text-xs ${mutedText}`}>{description}</p> : null}
          <div className={`flex flex-wrap gap-3 text-xs ${mutedText}`}>
            <span>{metadata ? `[repo ${metadata.owner}/${metadata.repo}]` : "[repo]"}</span>
            {metadata?.stars !== null && metadata?.stars !== undefined ? <span>[★ {metadata.stars}]</span> : null}
            {metadata?.forks !== null && metadata?.forks !== undefined ? <span>[forks {metadata.forks}]</span> : null}
            {metadata?.openIssues !== null && metadata?.openIssues !== undefined ? <span>[issues {metadata.openIssues}]</span> : null}
            {metadata?.primaryLanguage ? <span>[lang {metadata.primaryLanguage}]</span> : null}
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={block.url} target="_blank" rel="noreferrer" className={`block border p-4 transition-colors ${borderColor} ${hoverBg}`}>
      <div className="space-y-1">
        <p className="text-sm">{title}</p>
        {description ? <p className={`text-xs ${mutedText}`}>{description}</p> : null}
        <p className={`text-xs ${mutedText}`}>{domain} -&gt;</p>
      </div>
    </a>
  )
}

function renderBlock(
  block: ContentBlock,
  index: number,
  options: {
    links: PostLinkDTO[]
    assets: PostAssetDTO[]
    expandedEmbeds: Set<string>
    toggleEmbed: (id: string) => void
    copiedCode: number | null
    copyToClipboard: (code: string, index: number) => Promise<void>
    isDarkMode: boolean
    borderColor: string
    hoverBg: string
    mutedText: string
  },
) {
  const { links, assets, expandedEmbeds, toggleEmbed, copiedCode, copyToClipboard, isDarkMode, borderColor, hoverBg, mutedText } = options

  switch (block.type) {
    case "heading":
      return (
        <h2 key={block.id} className="pt-4 text-base">
          {block.text}
        </h2>
      )
    case "paragraph":
      return <p key={block.id} className={mutedText} dangerouslySetInnerHTML={{ __html: renderInlineMarkdownHtml(block.text) }} />
    case "quote":
      return (
        <blockquote
          key={block.id}
          className={`border-l-2 pl-4 italic ${mutedText} ${isDarkMode ? "border-[#D4FF00]/30" : "border-[#3F5200]/30"}`}
        >
          {block.text.split("\n").map((line, lineIndex) => (
            <p key={`${block.id}:line:${lineIndex}`} dangerouslySetInnerHTML={{ __html: renderInlineMarkdownHtml(line) }} />
          ))}
        </blockquote>
      )
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul"
      return (
        <ListTag
          key={block.id}
          className={`space-y-1 pl-5 text-sm ${mutedText} ${block.style === "ordered" ? "list-decimal" : "list-disc"}`}
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${block.id}:item:${itemIndex}`} dangerouslySetInnerHTML={{ __html: renderInlineMarkdownHtml(item) }} />
          ))}
        </ListTag>
      )
    }
    case "code":
      return (
        <DetailCodeBlock
          key={block.id}
          code={block.code}
          language={block.language}
          index={index}
          copiedCode={copiedCode}
          onCopy={copyToClipboard}
          isDarkMode={isDarkMode}
          borderColor={borderColor}
          hoverBg={hoverBg}
          mutedText={mutedText}
        />
      )
    case "math":
      return (
        <div
          key={block.id}
          className={`border px-4 py-3 text-sm ${borderColor} ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}
        >
          <code>{block.variant === "block" ? `$$ ${block.expression} $$` : `$${block.expression}$`}</code>
        </div>
      )
    case "image": {
      const asset = resolveImageAsset(block, assets)
      const src = block.url ?? asset?.url ?? ""
      if (!src) {
        return null
      }

      const caption = block.caption ?? null
      const alt = block.alt ?? asset?.originalName ?? "embedded asset"
      return (
        <figure key={block.id} className="space-y-2">
          <div className={`overflow-hidden border p-2 ${borderColor}`}>
            <img src={src} alt={alt} className="h-auto w-full" />
          </div>
          {caption ? <figcaption className={`text-xs ${mutedText}`}>{caption}</figcaption> : null}
        </figure>
      )
    }
    case "embed":
      return (
        <DetailEmbedBlock
          key={block.id}
          block={block}
          link={resolveLink(block.url, links)}
          expanded={expandedEmbeds.has(block.id)}
          onToggle={() => toggleEmbed(block.id)}
          borderColor={borderColor}
          hoverBg={hoverBg}
          mutedText={mutedText}
        />
      )
    case "thematicBreak":
      return <div key={block.id} className={`border-t pt-2 ${borderColor}`} />
  }
}

export function V0DetailContent({
  content,
  fallbackHtml,
  isDarkMode,
  borderColor,
  hoverBg,
  mutedText,
  links = [],
  assets = [],
}: {
  content?: unknown
  fallbackHtml?: string
  isDarkMode: boolean
  borderColor: string
  hoverBg: string
  mutedText: string
  links?: PostLinkDTO[]
  assets?: PostAssetDTO[]
}) {
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const [expandedEmbedIds, setExpandedEmbedIds] = useState<string[]>([])

  const blockDocument = useMemo(() => (isBlockDocument(content) ? content : null), [content])
  const legacyNodes = useMemo(() => (hasLegacyNodes(content) ? content.content : []), [content])
  const expandedEmbeds = useMemo(() => new Set(expandedEmbedIds), [expandedEmbedIds])

  const copyToClipboard = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleEmbed = (blockId: string) => {
    setExpandedEmbedIds((current) =>
      current.includes(blockId) ? current.filter((candidate) => candidate !== blockId) : [...current, blockId],
    )
  }

  if (blockDocument) {
    return (
      <article className="prose-terminal space-y-4 font-[var(--font-jetbrains-mono),monospace] text-sm leading-relaxed">
        {blockDocument.blocks.map((block, index) =>
          renderBlock(block, index, {
            links,
            assets,
            expandedEmbeds,
            toggleEmbed,
            copiedCode,
            copyToClipboard,
            isDarkMode,
            borderColor,
            hoverBg,
            mutedText,
          }),
        )}
      </article>
    )
  }

  if (legacyNodes.length > 0) {
    return (
      <article className="prose-terminal space-y-4 font-[var(--font-jetbrains-mono),monospace] text-sm leading-relaxed">
        {legacyNodes.map((node, index) => {
          switch (node.type) {
            case "heading":
              return (
                <h2 key={index} className="pt-4 text-base">
                  {getPlainText(node.content)}
                </h2>
              )
            case "blockquote":
              return (
                <blockquote
                  key={index}
                  className={`border-l-2 pl-4 italic ${mutedText} ${isDarkMode ? "border-[#D4FF00]/30" : "border-[#3F5200]/30"}`}
                >
                  {node.content?.map((line, quoteIndex) => (
                    <p key={quoteIndex} dangerouslySetInnerHTML={{ __html: renderInlineHtml(line.content ?? [line], isDarkMode) }} />
                  ))}
                </blockquote>
              )
            case "codeBlock": {
              const language = typeof node.attrs?.language === "string" ? node.attrs.language : ""
              const code = getPlainText(node.content)
              return (
                <DetailCodeBlock
                  key={index}
                  code={code}
                  language={language}
                  index={index}
                  copiedCode={copiedCode}
                  onCopy={copyToClipboard}
                  isDarkMode={isDarkMode}
                  borderColor={borderColor}
                  hoverBg={hoverBg}
                  mutedText={mutedText}
                />
              )
            }
            case "paragraph":
              return (
                <p
                  key={index}
                  className={mutedText}
                  dangerouslySetInnerHTML={{ __html: renderInlineHtml(node.content, isDarkMode) }}
                />
              )
            default:
              return Array.isArray(node.content) ? (
                <div key={index}>{node.content.map((child, childIndex) => <div key={childIndex}>{getPlainText([child])}</div>)}</div>
              ) : null
          }
        })}
      </article>
    )
  }

  const fallbackBlocks = extractFallbackBlocks(fallbackHtml ?? "")

  return (
    <article className="prose-terminal space-y-4 font-[var(--font-jetbrains-mono),monospace] text-sm leading-relaxed">
      {fallbackBlocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2 key={index} className="pt-4 text-base">
              {block.text}
            </h2>
          )
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className={`border-l-2 pl-4 italic ${mutedText} ${isDarkMode ? "border-[#D4FF00]/30" : "border-[#3F5200]/30"}`}
            >
              {block.lines.map((line, quoteIndex) => (
                <p key={quoteIndex}>{line}</p>
              ))}
            </blockquote>
          )
        }

        if (block.type === "code") {
          return (
            <DetailCodeBlock
              key={index}
              code={block.code}
              language={block.language}
              index={index}
              copiedCode={copiedCode}
              onCopy={copyToClipboard}
              isDarkMode={isDarkMode}
              borderColor={borderColor}
              hoverBg={hoverBg}
              mutedText={mutedText}
            />
          )
        }

        return (
          <p key={index} className={mutedText}>
            {block.html}
          </p>
        )
      })}
    </article>
  )
}
