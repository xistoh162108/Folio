import { createElement, type ReactNode } from "react"

import { CodeBlock } from "@/components/site/code-block"

type ContentNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{
    type?: string
    attrs?: Record<string, unknown>
  }>
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

function stripHtmlToParagraphs(html: string) {
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li|blockquote|pre)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")

  return decodeHtml(withLineBreaks)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function applyMarks(content: ReactNode, marks: ContentNode["marks"], key: string): ReactNode {
  if (!marks || marks.length === 0) {
    return content
  }

  return marks.reduceRight<ReactNode>((current, mark, index) => {
    const markKey = `${key}-mark-${index}`

    switch (mark?.type) {
      case "link":
        return (
          <a
            key={markKey}
            href={typeof mark.attrs?.href === "string" ? mark.attrs.href : "#"}
            target="_blank"
            rel="noreferrer"
            className="text-[#D4FF00] underline underline-offset-4 transition hover:text-white"
          >
            {current}
          </a>
        )
      case "bold":
        return <strong key={markKey}>{current}</strong>
      case "italic":
        return <em key={markKey}>{current}</em>
      case "strike":
        return <s key={markKey}>{current}</s>
      case "code":
        return (
          <code key={markKey} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.95em] text-[#D4FF00]">
            {current}
          </code>
        )
      default:
        return <span key={markKey}>{current}</span>
    }
  }, content)
}

function renderInline(nodes: ContentNode[] = []): ReactNode {
  if (nodes.length === 0) {
    return null
  }

  return nodes.map((node, index) => {
    if (node.type === "hardBreak") {
      return <br key={`br-${index}`} />
    }

    if (typeof node.text === "string") {
      return <span key={`text-${index}`}>{applyMarks(node.text, node.marks, `text-${index}`)}</span>
    }

    if (node.type === "image" && typeof node.attrs?.src === "string") {
      return (
        <img
          key={`image-${index}`}
          src={node.attrs.src}
          alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""}
          className="my-4 rounded-2xl border border-white/10"
        />
      )
    }

    if (Array.isArray(node.content)) {
      return <span key={`nested-${index}`}>{applyMarks(renderInline(node.content), node.marks, `nested-${index}`)}</span>
    }

    return null
  })
}

function renderBlocks(nodes: ContentNode[] = [], prefix = "block"): ReactNode {
  return nodes.map((node, index) => {
    const key = `${prefix}-${index}`

    switch (node.type) {
      case "heading": {
        const level = Number(node.attrs?.level ?? 2)
        const tagName = level >= 1 && level <= 6 ? `h${level}` : "h2"
        return createElement(tagName, { key }, renderInline(node.content))
      }
      case "paragraph":
        return <p key={key}>{renderInline(node.content)}</p>
      case "blockquote":
        return <blockquote key={key}>{renderBlocks(node.content, `${key}-quote`)}</blockquote>
      case "codeBlock":
        return (
          <CodeBlock key={key} code={getPlainText(node.content)} />
        )
      case "bulletList":
        return <ul key={key}>{renderBlocks(node.content, `${key}-ul`)}</ul>
      case "orderedList":
        return <ol key={key}>{renderBlocks(node.content, `${key}-ol`)}</ol>
      case "listItem":
        return <li key={key}>{renderBlocks(node.content, `${key}-li`)}</li>
      case "horizontalRule":
        return <hr key={key} className="border-white/10" />
      default:
        if (Array.isArray(node.content) && node.content.length > 0) {
          return <div key={key}>{renderBlocks(node.content, `${key}-nested`)}</div>
        }

        if (typeof node.text === "string") {
          return <p key={key}>{node.text}</p>
        }

        return null
    }
  })
}

export function RichContent({ content, fallbackHtml }: { content: unknown; fallbackHtml?: string | null }) {
  const nodes =
    typeof content === "object" &&
    content !== null &&
    "content" in content &&
    Array.isArray((content as { content?: unknown }).content)
      ? ((content as { content: ContentNode[] }).content ?? [])
      : []

  if (nodes.length > 0) {
    return <div className="space-y-5">{renderBlocks(nodes)}</div>
  }

  const paragraphs = stripHtmlToParagraphs(fallbackHtml ?? "")

  if (paragraphs.length === 0) {
    return <p>No content yet.</p>
  }

  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, index) => (
        <p key={`fallback-${index}`}>{paragraph}</p>
      ))}
    </div>
  )
}
