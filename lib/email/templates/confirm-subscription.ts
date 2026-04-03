import { buildEmailSignature } from "./signature"

export interface ConfirmSubscriptionTemplateInput {
  confirmUrl: string
  unsubscribeUrl: string
}

export function buildConfirmSubscriptionEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmSubscriptionTemplateInput) {
  const signature = buildEmailSignature({ unsubscribeUrl })

  return {
    subject: "Confirm your xistoh.log subscription",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:20px;margin-bottom:16px">Confirm your subscription</h1>
        <p>Finish activating your xistoh.log subscription by confirming the link below.</p>
        <p><a href="${confirmUrl}">Confirm subscription</a></p>
        <p>If this was not you, ignore this email.</p>
        ${signature.html}
      </div>
    `.trim(),
    text: [
      "Confirm your xistoh.log subscription.",
      "",
      `Confirm subscription: ${confirmUrl}`,
      "If this was not you, ignore this email.",
      "",
      signature.text,
    ].join("\n"),
  }
}
