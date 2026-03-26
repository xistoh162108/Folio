function parseBrowser(userAgent: string | null | undefined) {
  const ua = (userAgent ?? "").toLowerCase()

  if (ua.includes("edg/")) return "Edge"
  if (ua.includes("firefox/")) return "Firefox"
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari"
  if (ua.includes("chrome/")) return "Chrome"
  return "Unknown"
}

function parseOs(userAgent: string | null | undefined) {
  const ua = (userAgent ?? "").toLowerCase()

  if (ua.includes("mac os")) return "macOS"
  if (ua.includes("windows")) return "Windows"
  if (ua.includes("android")) return "Android"
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS"
  if (ua.includes("linux")) return "Linux"
  return "Unknown OS"
}

export function toLogSourceLabel(userAgent: string | null | undefined) {
  const browser = parseBrowser(userAgent)
  const os = parseOs(userAgent)
  return `${os}/${browser}`
}
