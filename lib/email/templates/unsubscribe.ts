import { buildV0EmailFrame } from "@/lib/email/templates/frame"

export interface UnsubscribeTemplateInput {
  homeUrl: string
  resubscribeUrl: string
}

export function buildUnsubscribeEmail({
  homeUrl,
  resubscribeUrl,
}: UnsubscribeTemplateInput) {
  const frame = buildV0EmailFrame({
    eyebrow: "SUBSCRIPTION CLOSED",
    title: "Subscription cancelled",
    bodyHtml: `
      <p>This address has been removed from future xistoh.log sends.</p>
      <p>You can return any time, and you can subscribe again later if you want the signal back.</p>
    `.trim(),
    bodyText: [
      "This address has been removed from future xistoh.log sends.",
      "You can return any time, and you can subscribe again later if you want the signal back.",
    ],
    primaryAction: {
      label: "return home",
      url: homeUrl,
    },
    secondaryActions: [
      {
        label: "subscribe again",
        url: resubscribeUrl,
      },
    ],
  })

  return {
    subject: "You have been unsubscribed from xistoh.log",
    html: frame.html,
    text: frame.text,
  }
}
