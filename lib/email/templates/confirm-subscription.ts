import { buildV0EmailFrame } from "@/lib/email/templates/frame"

export interface ConfirmSubscriptionTemplateInput {
  confirmUrl: string
  unsubscribeUrl: string
}

export function buildConfirmSubscriptionEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmSubscriptionTemplateInput) {
  const frame = buildV0EmailFrame({
    eyebrow: "CONFIRMATION REQUIRED",
    title: "One step left.",
    bodyHtml: `
      <p>Your address is in the queue, but it is not active yet.</p>
      <p>Confirm the link below to bring this subscription online.</p>
    `.trim(),
    bodyText: [
      "Your address is in the queue, but it is not active yet.",
      "Confirm the link below to bring this subscription online.",
    ],
    primaryAction: {
      label: "Confirm subscription",
      url: confirmUrl,
    },
    unsubscribeAction: {
      label: "Unsubscribe",
      url: unsubscribeUrl,
    },
  })

  return {
    subject: "Confirm your xistoh.log subscription",
    html: frame.html,
    text: frame.text,
  }
}
