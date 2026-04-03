function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n")
}

function stripKnownHighlighterMarkup(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?(?:span|code|pre)\b[^>]*>/gi, "")
}

function includesKnownStyleTokenMarkup(value: string) {
  return /<(?:span|code|pre)\b[^>]*\bclass\s*=\s*["'][^"']*(?:token|hljs|shiki|language-|line-numbers)[^"']*["'][^>]*>/i.test(value)
}

export function normalizeCodeForDetailRendering(code: string) {
  const decoded = normalizeLineEndings(decodeHtml(code)).trim()

  if (!includesKnownStyleTokenMarkup(decoded)) {
    return decoded
  }

  return stripKnownHighlighterMarkup(decoded)
}

export function renderHighlightedCodeHtml(code: string, isDarkMode: boolean) {
  const accentClass = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const mutedClass = isDarkMode ? "text-white/35" : "text-black/40"
  const sanitized = normalizeCodeForDetailRendering(code)
  const tokenPattern =
    /(#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:import|from|def|return|class|if|else|for|while|try|except|with|as|in|and|or|not|True|False|None)\b|\b(?:np|numpy|math|os|sys)\b|\b[a-zA-Z_][a-zA-Z0-9_]*\s*(?=\()|\b\d+\.?\d*\b)/gm

  let cursor = 0
  let output = ""
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(sanitized)) !== null) {
    const token = match[0]
    const start = match.index
    output += escapeHtml(sanitized.slice(cursor, start))
    const className = token.startsWith("#") ? mutedClass : accentClass
    output += `<span class="${className}">${escapeHtml(token)}</span>`
    cursor = start + token.length
  }

  output += escapeHtml(sanitized.slice(cursor))
  return output
}
