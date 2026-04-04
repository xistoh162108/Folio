import { buildV0EmailFrame } from "@/lib/email/templates/frame"

export interface ContactReceivedTemplateInput {
  name: string
  homeUrl: string
}

export function buildContactReceivedEmail({ name, homeUrl }: ContactReceivedTemplateInput) {
  const frame = buildV0EmailFrame({
    eyebrow: "CONTACT QUEUED",
    title: "Message received",
    bodyHtml: `
      <p>Hello ${name},</p>
      <p>Your message has been recorded and queued for review.</p>
    `.trim(),
    bodyText: [
      `Hello ${name},`,
      "Your message has been recorded and queued for review.",
    ],
    primaryAction: {
      label: "return home",
      url: homeUrl,
    },
  })

  return {
    subject: "We received your message — xistoh.log",
    html: frame.html,
    text: frame.text,
  }
}
