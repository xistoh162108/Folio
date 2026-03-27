function normalizeText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim()
}

function hasMeaningfulTextInNode(node: unknown): boolean {
  if (!node || typeof node !== "object") {
    return false
  }

  const maybeNode = node as {
    text?: unknown
    content?: unknown
  }

  if (typeof maybeNode.text === "string" && normalizeText(maybeNode.text).length > 0) {
    return true
  }

  if (Array.isArray(maybeNode.content)) {
    return maybeNode.content.some((child) => hasMeaningfulTextInNode(child))
  }

  return false
}

function hasMeaningfulTextInContent(content: unknown) {
  if (!content || typeof content !== "object") {
    return false
  }

  const maybeDocument = content as { content?: unknown; blocks?: unknown }
  if (Array.isArray(maybeDocument.blocks)) {
    return maybeDocument.blocks.some((block) => {
      if (!block || typeof block !== "object") {
        return false
      }

      const candidate = block as {
        type?: unknown
        text?: unknown
        items?: unknown
        code?: unknown
        expression?: unknown
        label?: unknown
        url?: unknown
        caption?: unknown
        alt?: unknown
      }

      if (typeof candidate.text === "string" && normalizeText(candidate.text).length > 0) {
        return true
      }

      if (Array.isArray(candidate.items) && candidate.items.some((item) => typeof item === "string" && normalizeText(item).length > 0)) {
        return true
      }

      if (typeof candidate.code === "string" && normalizeText(candidate.code).length > 0) {
        return true
      }

      if (typeof candidate.expression === "string" && normalizeText(candidate.expression).length > 0) {
        return true
      }

      if (candidate.type === "embed") {
        return (
          (typeof candidate.label === "string" && normalizeText(candidate.label).length > 0) ||
          (typeof candidate.url === "string" && normalizeText(candidate.url).length > 0)
        )
      }

      if (candidate.type === "image") {
        return (
          (typeof candidate.caption === "string" && normalizeText(candidate.caption).length > 0) ||
          (typeof candidate.alt === "string" && normalizeText(candidate.alt).length > 0)
        )
      }

      return false
    })
  }

  if (!Array.isArray(maybeDocument.content)) {
    return false
  }

  return maybeDocument.content.some((node) => hasMeaningfulTextInNode(node))
}

export function isEffectivelyEmptyDraft(input: {
  status: string
  title?: string | null
  excerpt?: string | null
  coverImageUrl?: string | null
  content?: unknown
  activeLinkCount: number
}) {
  if (input.status !== "DRAFT") {
    return false
  }

  const normalizedTitle = normalizeText(input.title)
  const normalizedExcerpt = normalizeText(input.excerpt)
  const normalizedCover = normalizeText(input.coverImageUrl)

  const hasMeaningfulTitle = normalizedTitle.length > 0 && normalizedTitle !== "Untitled draft"
  const hasMeaningfulExcerpt = normalizedExcerpt.length > 0
  const hasCover = normalizedCover.length > 0
  const hasMeaningfulText = hasMeaningfulTextInContent(input.content)
  const hasLinks = input.activeLinkCount > 0

  return !hasMeaningfulTitle && !hasMeaningfulExcerpt && !hasCover && !hasMeaningfulText && !hasLinks
}
