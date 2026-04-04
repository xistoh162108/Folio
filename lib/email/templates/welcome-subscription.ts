import { buildV0EmailFrame } from "@/lib/email/templates/frame"

export interface WelcomeSubscriptionTemplateInput {
  homeUrl: string
  unsubscribeUrl: string
}

export function buildWelcomeSubscriptionEmail({
  homeUrl,
  unsubscribeUrl,
}: WelcomeSubscriptionTemplateInput) {
  const frame = buildV0EmailFrame({
    eyebrow: "SUBSCRIPTION ONLINE",
    title: "Nice to meet you.",
    bodyHtml: `
      <p>Your xistoh.log subscription is now active.</p>
      <p>Future notes, project signals, and selected dispatches will route through this inbox.</p>
    `.trim(),
    bodyText: [
      "Your xistoh.log subscription is now active.",
      "Future notes, project signals, and selected dispatches will route through this inbox.",
    ],
    primaryAction: {
      label: "open xistoh.log",
      url: homeUrl,
    },
    unsubscribeAction: {
      label: "Unsubscribe",
      url: unsubscribeUrl,
    },
  })

  return {
    subject: "Nice to meet you — xistoh.log",
    html: frame.html,
    text: frame.text,
  }
}

