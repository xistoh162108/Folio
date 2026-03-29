import type { BlockDocument, PostContentMode } from "@/lib/contracts/content-blocks"

export { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"

const INLINE_LINK_RE = /\[[^\]]+\]\(((?:asset:\/\/[A-Za-z0-9-]+|https?:\/\/[^\s)]+))\)/g

type LegacyContentMark = {
  type?: string
  attrs?: Record<string, unknown>
}

type LegacyContentNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: LegacyContentMark[]
  content?: LegacyContentNode[]
}

function parseAssetProtocolUrl(value: string) {
  const match = value.trim().match(/^asset:\/\/([A-Za-z0-9-]+)$/)
  return match?.[1] ?? null
}

export function buildLegacyContentDocument(title: string, htmlContent: string) {
  if (htmlContent.trim().length === 0) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    }
  }

  const paragraphs = htmlContent
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      type: "paragraph",
      content: [{ type: "text", text: paragraph.replace(/<[^>]+>/g, "") }],
    }))

  return {
    type: "doc",
    content: paragraphs.length > 0 ? paragraphs : [{ type: "paragraph", content: [{ type: "text", text: title }] }],
  }
}

export function isBlockDocument(value: unknown): value is BlockDocument {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return candidate.type === "doc" && typeof candidate.version === "number" && Array.isArray(candidate.blocks)
}

export function normalizeContentResourceUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  try {
    const parsed = new URL(trimmed)
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return trimmed
  }
}

export function collectBlockDocumentResources(content: unknown) {
  const linkUrls = new Set<string>()
  const assetIds = new Set<string>()
  const assetUrls = new Set<string>()

  const collectInlineTarget = (target: string) => {
    const trimmed = target.trim()
    if (!trimmed) {
      return
    }

    const assetId = parseAssetProtocolUrl(trimmed)
    if (assetId) {
      assetIds.add(assetId)
      return
    }

    linkUrls.add(normalizeContentResourceUrl(trimmed))
  }

  if (isBlockDocument(content)) {
    for (const block of content.blocks) {
      if (block.type === "embed") {
        const normalizedUrl = normalizeContentResourceUrl(block.url)
        if (normalizedUrl) {
          linkUrls.add(normalizedUrl)
        }
        continue
      }

      const inlineSources =
        block.type === "paragraph"
          ? [block.text]
          : block.type === "heading"
            ? [block.text]
            : block.type === "quote"
              ? [block.text]
              : block.type === "list"
                ? block.items
                : []

      for (const source of inlineSources) {
        for (const match of source.matchAll(INLINE_LINK_RE)) {
          collectInlineTarget(match[1] ?? "")
        }
      }

      if (block.type === "image") {
        if (typeof block.assetId === "string" && block.assetId.trim().length > 0) {
          assetIds.add(block.assetId)
        }

        if (typeof block.url === "string" && block.url.trim().length > 0) {
          assetUrls.add(normalizeContentResourceUrl(block.url))
        }
      }
    }
  } else if (typeof content === "object" && content !== null && Array.isArray((content as { content?: unknown }).content)) {
    const walkLegacyNodes = (nodes: LegacyContentNode[]) => {
      for (const node of nodes) {
        if (typeof node.attrs?.href === "string") {
          collectInlineTarget(node.attrs.href)
        }

        if (Array.isArray(node.marks)) {
          for (const mark of node.marks) {
            if (mark.type === "link" && typeof mark.attrs?.href === "string") {
              collectInlineTarget(mark.attrs.href)
            }
          }
        }

        if (typeof node.text === "string") {
          for (const match of node.text.matchAll(INLINE_LINK_RE)) {
            collectInlineTarget(match[1] ?? "")
          }
        }

        if (Array.isArray(node.content)) {
          walkLegacyNodes(node.content)
        }
      }
    }

    walkLegacyNodes((content as { content: LegacyContentNode[] }).content)
  } else {
    return {
      linkUrls: [] as string[],
      assetIds: [] as string[],
      assetUrls: [] as string[],
    }
  }

  return {
    linkUrls: [...linkUrls],
    assetIds: [...assetIds],
    assetUrls: [...assetUrls],
  }
}

export function resolvePostContentMode(input: {
  contentVersion: number
  markdownSource?: string | null
  content?: unknown
}): PostContentMode {
  if (typeof input.markdownSource === "string" && input.markdownSource.trim().length > 0) {
    return "block"
  }

  if (isBlockDocument(input.content)) {
    return "block"
  }

  return "legacy"
}
