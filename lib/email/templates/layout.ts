import { getEmailBaseUrl } from "@/lib/email/provider"

interface EmailLayoutInput {
  bodyHtml: string
}

const EMAIL_MAX_WIDTH = 600
const EMAIL_BG = "#040404"
const EMAIL_PANEL_BG = "#0b0b0b"
const EMAIL_BORDER = "#1f1f1f"
const EMAIL_TEXT = "#e5e7eb"
const EMAIL_MUTED = "#9ca3af"

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

export function withEmailLayout({ bodyHtml }: EmailLayoutInput) {
  const baseUrl = normalizeBaseUrl(getEmailBaseUrl())
  const bannerUrl = `${baseUrl}/apple-icon.png`

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;margin:0;padding:24px 0;background-color:${EMAIL_BG}">
      <tr>
        <td align="center" style="padding:0 12px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${EMAIL_MAX_WIDTH}" style="width:100%;max-width:${EMAIL_MAX_WIDTH}px;background-color:${EMAIL_PANEL_BG};border:1px solid ${EMAIL_BORDER};font-family:Arial,sans-serif;color:${EMAIL_TEXT}">
            <tr>
              <td align="center" style="padding:24px 24px 16px;border-bottom:1px solid ${EMAIL_BORDER}">
                <img src="${bannerUrl}" width="88" height="88" alt="xistoh.log" style="display:block;width:88px;height:88px;border:0;outline:none;text-decoration:none" />
                <p style="margin:12px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_MUTED}">xistoh.log</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:${EMAIL_TEXT}">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim()
}
