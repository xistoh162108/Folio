import { withEmailLayout } from "@/lib/email/templates/layout"

export interface UnsubscribeTemplateInput {
  homeUrl: string
  resubscribeUrl: string
}

export function buildUnsubscribeEmail({
  homeUrl,
  resubscribeUrl,
}: UnsubscribeTemplateInput) {
  return {
    subject: "You have been unsubscribed from xistoh.log",
    html: withEmailLayout({
      bodyHtml: `
        <h1 style="font-size:20px;line-height:1.3;margin:0 0 16px;color:#f9fafb">Subscription cancelled</h1>
        <p style="margin:0 0 16px;color:#e5e7eb">You have been removed from future xistoh.log sends.</p>
        <p style="margin:0 0 16px;color:#e5e7eb">You can revisit the site any time: <a href="${homeUrl}" style="color:#93c5fd">${homeUrl}</a></p>
        <p style="margin:0;color:#e5e7eb">If you want to subscribe again later, use: <a href="${resubscribeUrl}" style="color:#93c5fd">${resubscribeUrl}</a></p>
      `.trim(),
    }),
    text: [
      "Subscription cancelled.",
      "",
      "You have been removed from future xistoh.log sends.",
      `Home: ${homeUrl}`,
      `Subscribe again: ${resubscribeUrl}`,
    ].join("\n"),
  }
}
