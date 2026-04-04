import { buildV0EmailFrame } from "@/lib/email/templates/frame"

export interface TestEmailTemplateInput {
  subject: string
  html: string
  text?: string
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function buildTestEmail({ subject, html, text }: TestEmailTemplateInput) {
  const frame = buildV0EmailFrame({
    eyebrow: "TEST SEND",
    title: subject,
    bodyHtml: `<p>This is a local test dispatch from xistoh.log.</p>${html}`,
    bodyText: ["This is a local test dispatch from xistoh.log.", text?.trim() || stripHtml(html)].filter(Boolean),
  })

  return {
    subject,
    html: frame.html,
    text: frame.text,
  }
}
