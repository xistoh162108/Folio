export interface ContactReceivedTemplateInput {
  name: string
  homeUrl: string
}

export function buildContactReceivedEmail({ name, homeUrl }: ContactReceivedTemplateInput) {
  return {
    subject: "We received your message — xistoh.log",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <h1 style="font-size:20px;margin-bottom:16px">Message received</h1>
        <p>Hello ${name},</p>
        <p>Your message has been recorded and queued for review.</p>
        <p>You can return to the site here: <a href="${homeUrl}">${homeUrl}</a></p>
      </div>
    `.trim(),
    text: [
      `Hello ${name},`,
      "",
      "Your message has been recorded and queued for review.",
      `Return to the site: ${homeUrl}`,
    ].join("\n"),
  }
}
