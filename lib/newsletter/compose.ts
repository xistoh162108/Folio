import { buildMarkdownWriterPayload } from "@/lib/content/markdown-blocks"
import type { NewsletterAssetDTO } from "@/lib/contracts/newsletter"

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function buildNewsletterComposePayload(markdown: string, assets: NewsletterAssetDTO[] = []) {
  const markdownAssets = assets
    .filter((asset) => asset.kind === "IMAGE" && asset.publicUrl)
    .map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      url: asset.publicUrl ?? null,
    }))

  const rendered = buildMarkdownWriterPayload(markdown, markdownAssets)
  const text = stripHtml(rendered.htmlContent)

  return {
    markdownSource: rendered.markdownSource,
    html: rendered.htmlContent,
    text,
  }
}

