export interface ConfirmSubscriptionTemplateInput {
  confirmUrl: string
  unsubscribeUrl: string
}

export function buildConfirmSubscriptionEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmSubscriptionTemplateInput) {
  return {
    subject: "Confirm your jimin.garden subscription",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:20px;margin-bottom:16px">Confirm your subscription</h1>
        <p>Finish activating your jimin.garden subscription by confirming the link below.</p>
        <p><a href="${confirmUrl}">Confirm subscription</a></p>
        <p>If this was not you, ignore this email.</p>
        <p style="font-size:12px;color:#666">Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
      </div>
    `.trim(),
    text: [
      "Confirm your jimin.garden subscription.",
      "",
      `Confirm subscription: ${confirmUrl}`,
      "If this was not you, ignore this email.",
      "",
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  }
}
