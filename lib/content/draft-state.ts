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

  const maybeDocument = content as { content?: unknown }
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
