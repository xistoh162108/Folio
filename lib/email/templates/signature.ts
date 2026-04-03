export interface EmailSignatureInput {
  homeUrl?: string | null
  unsubscribeUrl?: string | null
}

export function buildEmailSignature({ homeUrl, unsubscribeUrl }: EmailSignatureInput = {}) {
  const htmlLines = [
    "--",
    "xistoh.log // terminal dispatch",
    "Replies are not monitored.",
  ]

  const textLines = [
    "--",
    "xistoh.log // terminal dispatch",
    "Replies are not monitored.",
  ]

  if (homeUrl) {
    htmlLines.push(`Site: <a href=\"${homeUrl}\">${homeUrl}</a>`)
    textLines.push(`Site: ${homeUrl}`)
  }

  if (unsubscribeUrl) {
    htmlLines.push(`Unsubscribe: <a href=\"${unsubscribeUrl}\">${unsubscribeUrl}</a>`)
    textLines.push(`Unsubscribe: ${unsubscribeUrl}`)
  }

  return {
    html: `<p style=\"font-size:12px;color:#666;margin-top:20px\">${htmlLines.join("<br />")}</p>`,
    text: textLines.join("\n"),
  }
}
