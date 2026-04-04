import { buildV0EmailFrame } from "@/lib/email/templates/frame"

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
  const frame = buildV0EmailFrame({
    eyebrow: "DISPATCH",
    title: subject,
    bodyHtml: html,
    bodyText: [text?.trim() || ""].filter(Boolean),
    unsubscribeAction: unsubscribeUrl
      ? {
          label: "Unsubscribe",
          url: unsubscribeUrl,
        }
      : null,
  })

  return {
    subject,
    html: frame.html,
    text: frame.text.trim() || undefined,
  }
}
