export interface WelcomeSubscriptionTemplateInput {
  homeUrl: string
  unsubscribeUrl: string
}

export function buildWelcomeSubscriptionEmail({
  homeUrl,
  unsubscribeUrl,
}: WelcomeSubscriptionTemplateInput) {
  return {
    subject: "You’re in — welcome to xistoh.log",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:20px;margin-bottom:16px">Welcome aboard</h1>
        <p>Good signal only. You’re now subscribed to xistoh.log.</p>
        <p>Start here: <a href="${homeUrl}">${homeUrl}</a></p>
        <p style="font-size:12px;color:#666">Need out? Unsubscribe: <a href="${unsubscribeUrl}">${unsubscribeUrl}</a></p>
      </div>
    `.trim(),
    text: [
      "Welcome to xistoh.log.",
      "Good signal only. You’re now subscribed.",
      "",
      `Start here: ${homeUrl}`,
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  }
}
