export interface UnsubscribeTemplateInput {
  homeUrl: string
  resubscribeUrl: string
}

export function buildUnsubscribeEmail({
  homeUrl,
  resubscribeUrl,
}: UnsubscribeTemplateInput) {
  return {
    subject: "You have been unsubscribed from jimin.garden",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:20px;margin-bottom:16px">Subscription cancelled</h1>
        <p>You have been removed from future jimin.garden sends.</p>
        <p>You can revisit the site any time: <a href="${homeUrl}">${homeUrl}</a></p>
        <p>If you want to subscribe again later, use: <a href="${resubscribeUrl}">${resubscribeUrl}</a></p>
      </div>
    `.trim(),
    text: [
      "Subscription cancelled.",
      "",
      "You have been removed from future jimin.garden sends.",
      `Home: ${homeUrl}`,
      `Subscribe again: ${resubscribeUrl}`,
    ].join("\n"),
  }
}
