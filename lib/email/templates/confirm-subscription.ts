import { withEmailLayout } from "@/lib/email/templates/layout"

export interface ConfirmSubscriptionTemplateInput {
  confirmUrl: string
  unsubscribeUrl: string
}

export function buildConfirmSubscriptionEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmSubscriptionTemplateInput) {
  return {
    subject: "Confirm your xistoh.log subscription",
    html: withEmailLayout({
      bodyHtml: `
        <h1 style="font-size:20px;line-height:1.3;margin:0 0 16px;color:#f9fafb">Confirm your subscription</h1>
        <p style="margin:0 0 16px;color:#e5e7eb">Finish activating your xistoh.log subscription by confirming the link below.</p>
        <p style="margin:0 0 16px"><a href="${confirmUrl}" style="color:#93c5fd">Confirm subscription</a></p>
        <p style="margin:0 0 16px;color:#e5e7eb">If this was not you, ignore this email.</p>
        <p style="margin:0;font-size:12px;color:#9ca3af">Unsubscribe: <a href="${unsubscribeUrl}" style="color:#93c5fd">${unsubscribeUrl}</a></p>
      `.trim(),
    }),
    text: [
      "Confirm your xistoh.log subscription.",
      "",
      `Confirm subscription: ${confirmUrl}`,
      "If this was not you, ignore this email.",
      "",
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  }
}
