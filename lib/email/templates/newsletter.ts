import { withEmailLayout } from "@/lib/email/templates/layout"

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
  const unsubscribeHtml = unsubscribeUrl
    ? `<hr /><p style="font-size:12px;color:#666">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>`
    : ""

  const unsubscribeText = unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ""

  return {
    subject,
    html: withEmailLayout({
      bodyHtml: `${html}${unsubscribeHtml}`,
    }),
    text: `${text?.trim() || ""}${unsubscribeText}`.trim() || undefined,
  }
}
