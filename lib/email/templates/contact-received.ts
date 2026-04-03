import { withEmailLayout } from "@/lib/email/templates/layout"

export interface ContactReceivedTemplateInput {
  name: string
  homeUrl: string
}

export function buildContactReceivedEmail({ name, homeUrl }: ContactReceivedTemplateInput) {
  return {
    subject: "We received your message — xistoh.log",
    html: withEmailLayout({
      bodyHtml: `
        <h1 style="font-size:20px;line-height:1.3;margin:0 0 16px;color:#f9fafb">Message received</h1>
        <p style="margin:0 0 16px;color:#e5e7eb">Hello ${name},</p>
        <p style="margin:0 0 16px;color:#e5e7eb">Your message has been recorded and queued for review.</p>
        <p style="margin:0;color:#e5e7eb">You can return to the site here: <a href="${homeUrl}" style="color:#93c5fd">${homeUrl}</a></p>
      `.trim(),
    }),
    text: [
      `Hello ${name},`,
      "",
      "Your message has been recorded and queued for review.",
      `Return to the site: ${homeUrl}`,
    ].join("\n"),
  }
}
