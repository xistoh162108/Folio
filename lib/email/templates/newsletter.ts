import { buildEmailSignature } from "./signature"

export interface NewsletterTemplateInput {
  subject: string
  html: string
  text?: string | null
  unsubscribeUrl?: string | null
}

export function buildNewsletterEmail({
  subject,
  html,
  text,
  unsubscribeUrl,
}: NewsletterTemplateInput) {
  const signature = buildEmailSignature({ unsubscribeUrl })

  return {
    subject,
    html: `${html}${signature.html}`,
    text: `${text?.trim() || ""}${text ? "\n\n" : ""}${signature.text}`.trim() || undefined,
  }
}
