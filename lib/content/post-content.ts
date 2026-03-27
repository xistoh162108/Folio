import type { BlockDocument, PostContentMode } from "@/lib/contracts/content-blocks"

export { POST_BLOCK_CONTENT_VERSION } from "@/lib/contracts/content-blocks"

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

  if (!isBlockDocument(content)) {
    return {
      linkUrls: [] as string[],
      assetIds: [] as string[],
      assetUrls: [] as string[],
    }
  }

  for (const block of content.blocks) {
    if (block.type === "embed") {
      const normalizedUrl = normalizeContentResourceUrl(block.url)
      if (normalizedUrl) {
        linkUrls.add(normalizedUrl)
      }
      continue
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
