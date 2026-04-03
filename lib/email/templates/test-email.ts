import { withEmailLayout } from "@/lib/email/templates/layout"

export interface TestEmailTemplateInput {
  subject: string
  html: string
  text?: string
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function buildTestEmail({ subject, html, text }: TestEmailTemplateInput) {
  const intro = "This is a test email from xistoh.log."

  return {
    subject,
    html: withEmailLayout({
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af">${intro}</p>
        <hr style="margin:0 0 16px;border:none;border-top:1px solid #1f1f1f" />
        ${html}
      `.trim(),
    }),
    text: [intro, "", text?.trim() || stripHtml(html)].join("\n"),
  }
}
