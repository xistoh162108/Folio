export interface V0EmailActionLink {
  label: string
  url: string
}

export interface V0EmailFrameInput {
  eyebrow: string
  title: string
  bodyHtml: string
  bodyText: string[]
  primaryAction?: V0EmailActionLink | null
  secondaryActions?: V0EmailActionLink[]
  unsubscribeAction?: V0EmailActionLink | null
}

const BANNER_LINES = [
  ".:: xistoh.log ::.",
  "..##..::signal::..##..",
  ".:: dispatch / terminal-native ::.",
]

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderBanner() {
  return `
    <div style="background:#050505;border:1px solid #3F5200;padding:16px 18px;margin-bottom:24px">
      <div style="font-family:Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#D4FF00">
        // xistoh.log
      </div>
      <pre style="margin:12px 0 0;font-family:Menlo,Consolas,monospace;font-size:12px;line-height:1.2;color:#D4FF00;white-space:pre-wrap">${BANNER_LINES.join("\n")}</pre>
    </div>
  `.trim()
}

function renderActionLink(link: V0EmailActionLink) {
  return `
    <a
      href="${link.url}"
      style="display:inline-block;padding:8px 12px;border:1px solid #3F5200;color:#3F5200;text-decoration:none;font-family:Menlo,Consolas,monospace;font-size:12px"
    >
      [${escapeHtml(link.label)}]
    </a>
  `.trim()
}

function buildSignatureText() {
  return ["--", "Jimin Park", "xistoh.log"].join("\n")
}

export function buildV0EmailFrame({
  eyebrow,
  title,
  bodyHtml,
  bodyText,
  primaryAction = null,
  secondaryActions = [],
  unsubscribeAction = null,
}: V0EmailFrameInput) {
  const actionLinks = [primaryAction, ...secondaryActions].filter((link): link is V0EmailActionLink => Boolean(link))

  const html = `
    <div style="margin:0;padding:24px;background:#f6f6f1;color:#111;font-family:Menlo,Consolas,monospace;line-height:1.7">
      <div style="max-width:720px;margin:0 auto">
        ${renderBanner()}
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3F5200">// ${escapeHtml(eyebrow)}</div>
        <h1 style="margin:10px 0 16px;font-size:22px;line-height:1.3;font-weight:500;color:#111">${escapeHtml(title)}</h1>
        <div style="font-size:14px;color:#111">${bodyHtml}</div>
        ${
          actionLinks.length > 0
            ? `<div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:10px">${actionLinks.map(renderActionLink).join("")}</div>`
            : ""
        }
        ${
          unsubscribeAction
            ? `<p style="margin-top:24px;font-size:12px;color:#444">Need a quieter inbox? <a href="${unsubscribeAction.url}" style="color:#3F5200;text-decoration:underline">${escapeHtml(unsubscribeAction.label)}</a>.</p>`
            : ""
        }
        <div style="margin-top:28px;padding-top:18px;border-top:1px solid #d4d4c8;font-size:12px;color:#444;white-space:pre-line">${escapeHtml(buildSignatureText())}</div>
      </div>
    </div>
  `.trim()

  const text = [
    "xistoh.log",
    "",
    `// ${eyebrow}`,
    title,
    "",
    ...bodyText,
    ...(primaryAction ? ["", `${primaryAction.label}: ${primaryAction.url}`] : []),
    ...secondaryActions.map((link) => `${link.label}: ${link.url}`),
    ...(unsubscribeAction ? ["", `Unsubscribe: ${unsubscribeAction.url}`] : []),
    "",
    buildSignatureText(),
  ].join("\n")

  return {
    html,
    text,
  }
}

