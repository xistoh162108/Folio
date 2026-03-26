export interface TestEmailTemplateInput {
  subject: string
  html: string
  text?: string
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function buildTestEmail({ subject, html, text }: TestEmailTemplateInput) {
  const intro = "This is a test email from jimin.garden."

  return {
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#666">${intro}</p>
        <hr style="margin:16px 0;border:none;border-top:1px solid #ddd" />
        ${html}
      </div>
    `.trim(),
    text: [intro, "", text?.trim() || stripHtml(html)].join("\n"),
  }
}
