import http from "http"
import https from "https"
import { lookup } from "dns/promises"
import { isIP } from "net"

import type { PostLinkDTO, PostLinkType, PreviewFetchStatus, PreviewMetadata } from "@/lib/contracts/posts"

const PREVIEW_TIMEOUT_MS = 4_000
const MAX_CONTENT_LENGTH = 512 * 1024
const MAX_REDIRECTS = 3
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"])
const ALLOWED_PORTS = new Set(["", "80", "443"])

function hostnameMatches(hostname: string, target: string) {
  return hostname === target || hostname.endsWith(`.${target}`)
}

function getMetaContent(html: string, selectors: string[]) {
  for (const selector of selectors) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${selector}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    )
    const match = html.match(pattern)
    if (match?.[1]) {
      return decodeHtml(match[1])
    }
  }

  return null
}

function getTitle(html: string) {
  const ogTitle = getMetaContent(html, ["og:title", "twitter:title"])
  if (ogTitle) {
    return ogTitle
  }

  const match = html.match(/<title>([^<]+)<\/title>/i)
  return match?.[1] ? decodeHtml(match[1]) : null
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function normalizeExternalUrl(rawUrl: string) {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    throw new Error("URL is required.")
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = new URL(withProtocol)

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP(S) URLs are supported.")
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with credentials are not allowed.")
  }

  if (!ALLOWED_PORTS.has(parsed.port)) {
    throw new Error("Only ports 80 and 443 are allowed.")
  }

  parsed.hash = ""
  return parsed.toString()
}

export function extractYouTubeVideoId(rawUrl: string) {
  const url = new URL(rawUrl)

  if (url.hostname.includes("youtu.be")) {
    return url.pathname.replace("/", "") || null
  }

  if (url.hostname.includes("youtube.com")) {
    return url.searchParams.get("v")
  }

  return null
}

export function inferLinkType(rawUrl: string): PostLinkType {
  const url = new URL(rawUrl)
  const hostname = url.hostname.toLowerCase()

  if (hostnameMatches(hostname, "youtube.com") || hostnameMatches(hostname, "youtu.be")) {
    return "YOUTUBE"
  }

  if (hostnameMatches(hostname, "github.com")) {
    return "GITHUB"
  }

  return "WEBSITE"
}

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map((part) => Number(part))
  const [a = 0, b = 0] = octets

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase()

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  )
}

type ResolvedPreviewTarget = {
  address: string
  family: 4 | 6
  url: URL
  hostname: string
}

function isPublicAddress(address: string, family: number) {
  if (family === 4) {
    return !isPrivateIpv4(address)
  }

  if (family === 6) {
    return !isPrivateIpv6(address)
  }

  return false
}

async function resolvePublicPreviewTarget(rawUrl: string): Promise<ResolvedPreviewTarget> {
  const url = new URL(rawUrl)
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "")

  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("Private network hosts are not allowed.")
  }

  const literalIpVersion = isIP(hostname)
  if (literalIpVersion === 4 && isPrivateIpv4(hostname)) {
    throw new Error("Private IP addresses are not allowed.")
  }
  if (literalIpVersion === 6 && isPrivateIpv6(hostname)) {
    throw new Error("Private IP addresses are not allowed.")
  }

  const records =
    literalIpVersion > 0
      ? [{ address: hostname, family: literalIpVersion }]
      : await lookup(hostname, { all: true, verbatim: true })

  const publicRecord = records.find((record) => isPublicAddress(record.address, record.family))
  if (!publicRecord) {
    throw new Error("Resolved address is private and cannot be fetched.")
  }

  return {
    address: publicRecord.address,
    family: publicRecord.family as 4 | 6,
    url,
    hostname,
  }
}

type PinnedResponse = {
  status: number
  ok: boolean
  url: string
  headers: Headers
  body: string
}

async function requestPinnedUrl(target: ResolvedPreviewTarget): Promise<PinnedResponse> {
  const transport = target.url.protocol === "https:" ? https : http
  const port = target.url.port ? Number(target.url.port) : target.url.protocol === "https:" ? 443 : 80

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        host: target.address,
        family: target.family,
        port,
        method: "GET",
        path: `${target.url.pathname}${target.url.search}`,
        servername: target.hostname,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "jimin.garden-preview-bot/1.0",
          Host: target.hostname,
        },
      },
      (response) => {
        const headers = new Headers()

        for (const [key, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) {
            headers.set(key, value.join(", "))
          } else if (typeof value === "string") {
            headers.set(key, value)
          }
        }

        if ((response.statusCode ?? 0) >= 300 && (response.statusCode ?? 0) < 400) {
          response.resume()
          resolve({
            status: response.statusCode ?? 500,
            ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 300,
            url: target.url.toString(),
            headers,
            body: "",
          })
          return
        }

        const chunks: Buffer[] = []
        let totalBytes = 0

        response.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length

          if (totalBytes > MAX_CONTENT_LENGTH) {
            request.destroy(new Error("Remote page is too large to preview."))
            return
          }

          chunks.push(Buffer.from(chunk))
        })

        response.on("end", () => {
          resolve({
            status: response.statusCode ?? 500,
            ok: (response.statusCode ?? 0) >= 200 && (response.statusCode ?? 0) < 300,
            url: target.url.toString(),
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        })
      },
    )

    request.setTimeout(PREVIEW_TIMEOUT_MS, () => {
      request.destroy(new Error("Preview fetch timed out."))
    })

    request.on("error", reject)
    request.end()
  })
}

type PreviewResult = {
  normalizedUrl: string
  url: string
  type: PostLinkType
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  embedUrl: string | null
  previewStatus: PreviewFetchStatus
  failureReason: string | null
  metadata: PreviewMetadata | null
}

export async function fetchLinkPreview(rawUrl: string): Promise<PreviewResult> {
  const normalizedUrl = normalizeExternalUrl(rawUrl)
  const type = inferLinkType(normalizedUrl)

  if (type === "GITHUB") {
    const githubPreview = await fetchGitHubSpecialPreview(normalizedUrl)
    if (githubPreview) {
      return githubPreview
    }
  }

  if (type === "YOUTUBE") {
    const videoId = extractYouTubeVideoId(normalizedUrl)

    if (!videoId) {
      return {
        normalizedUrl,
        url: normalizedUrl,
        type,
        title: null,
        description: null,
        imageUrl: null,
        siteName: "YouTube",
        embedUrl: null,
        previewStatus: "FAILED",
        failureReason: "Invalid YouTube URL.",
        metadata: null,
      }
    }

    return {
      normalizedUrl,
      url: normalizedUrl,
      type,
      title: null,
      description: null,
      imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      siteName: "YouTube",
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      previewStatus: "READY",
      failureReason: null,
      metadata: { kind: "GENERIC" },
    }
  }

  if (type === "GITHUB") {
    const githubPreview = await fetchGitHubPreview(normalizedUrl)
    if (githubPreview) {
      return githubPreview
    }
  }

  try {
    const response = await fetchWithRedirects(normalizedUrl)

    const contentType = response.headers.get("content-type") ?? ""
    const contentLength = Number(response.headers.get("content-length") ?? "0")

    if (!response.ok) {
      return failedPreview(normalizedUrl, type, `Remote server responded with ${response.status}.`)
    }

    if (!contentType.includes("text/html")) {
      return failedPreview(normalizedUrl, type, "Only HTML pages can be previewed.")
    }

    if (contentLength > MAX_CONTENT_LENGTH) {
      return failedPreview(normalizedUrl, type, "Remote page is too large to preview.")
    }

    const html = response.body.slice(0, MAX_CONTENT_LENGTH)

    return {
      normalizedUrl,
      url: response.url || normalizedUrl,
      type,
      title: getTitle(html),
      description: getMetaContent(html, ["description", "og:description", "twitter:description"]),
      imageUrl: getMetaContent(html, ["og:image", "twitter:image"]),
      siteName: getMetaContent(html, ["og:site_name"]) ?? new URL(response.url || normalizedUrl).hostname,
      embedUrl: null,
      previewStatus: "READY",
      failureReason: null,
      metadata: { kind: "GENERIC" },
    }
  } catch (error) {
    return failedPreview(normalizedUrl, type, error instanceof Error ? error.message : "Preview fetch failed.")
  }
}

async function fetchGitHubPreview(normalizedUrl: string): Promise<PreviewResult | null> {
  try {
    const url = new URL(normalizedUrl)
    const [owner, repo] = url.pathname.split("/").filter(Boolean)

    if (!owner || !repo) {
      return null
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "jimin.garden-preview-bot/1.0",
      },
      signal: AbortSignal.timeout(PREVIEW_TIMEOUT_MS),
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      full_name?: string
      description?: string | null
      name?: string | null
      stargazers_count?: number | null
      forks_count?: number | null
      language?: string | null
      open_issues_count?: number | null
      owner?: { avatar_url?: string | null }
      html_url?: string
    }

    return {
      normalizedUrl,
      url: payload.html_url ?? normalizedUrl,
      type: "GITHUB",
      title: payload.full_name ?? `${owner}/${repo}`,
      description: payload.description ?? null,
      imageUrl: payload.owner?.avatar_url ?? null,
      siteName: "GitHub",
      embedUrl: null,
      previewStatus: "READY",
      failureReason: null,
      metadata: {
        kind: "GITHUB",
        owner,
        repo: payload.name ?? repo,
        stars: payload.stargazers_count ?? null,
        forks: payload.forks_count ?? null,
        primaryLanguage: payload.language ?? null,
        openIssues: payload.open_issues_count ?? null,
      },
    }
  } catch {
    return null
  }
}

async function fetchGitHubSpecialPreview(normalizedUrl: string): Promise<PreviewResult | null> {
  try {
    const url = new URL(normalizedUrl)
    const parts = url.pathname.split("/").filter(Boolean)

    if (parts.length < 2) {
      return null
    }

    const [owner, repo] = parts
    if (!owner || !repo) {
      return null
    }

    const apiResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "jimin.garden-preview-bot/1.0",
      },
      signal: AbortSignal.timeout(PREVIEW_TIMEOUT_MS),
    })

    if (!apiResponse.ok) {
      return null
    }

    const payload = (await apiResponse.json()) as {
      full_name?: string
      description?: string | null
      name?: string | null
      stargazers_count?: number | null
      forks_count?: number | null
      language?: string | null
      open_issues_count?: number | null
      owner?: { avatar_url?: string | null; login?: string | null }
      html_url?: string
    }

    return {
      normalizedUrl,
      url: payload.html_url ?? normalizedUrl,
      type: "GITHUB",
      title: payload.full_name ?? `${owner}/${repo}`,
      description: payload.description ?? null,
      imageUrl: payload.owner?.avatar_url ?? null,
      siteName: "GitHub",
      embedUrl: null,
      previewStatus: "READY",
      failureReason: null,
      metadata: {
        kind: "GITHUB",
        owner: payload.owner?.login ?? owner,
        repo: payload.name ?? repo,
        stars: payload.stargazers_count ?? null,
        forks: payload.forks_count ?? null,
        primaryLanguage: payload.language ?? null,
        openIssues: payload.open_issues_count ?? null,
      },
    }
  } catch {
    return null
  }
}

async function fetchWithRedirects(url: string, redirectCount = 0): Promise<PinnedResponse> {
  const resolved = await resolvePublicPreviewTarget(url)
  const response = await requestPinnedUrl(resolved)

  if (response.status >= 300 && response.status < 400) {
    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error("Too many redirects.")
    }

    const location = response.headers.get("location")
    if (!location) {
      throw new Error("Redirect missing location header.")
    }

    const nextUrl = new URL(location, url).toString()
    return fetchWithRedirects(nextUrl, redirectCount + 1)
  }

  return response
}

function failedPreview(normalizedUrl: string, type: PostLinkType, failureReason: string): PreviewResult {
  return {
    normalizedUrl,
    url: normalizedUrl,
    type,
    title: null,
    description: null,
    imageUrl: null,
    siteName: null,
    embedUrl: null,
    previewStatus: "FAILED",
    failureReason,
    metadata: null,
  }
}

export function toPostLinkDTO(input: PreviewResult & { label?: string | null; id?: string }) {
  return {
    id: input.id,
    label: input.label?.trim() || input.title || input.siteName || input.url,
    url: input.url,
    type: input.type,
    normalizedUrl: input.normalizedUrl,
    siteName: input.siteName,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    embedUrl: input.embedUrl,
    previewStatus: input.previewStatus,
    metadata: input.metadata,
  } satisfies PostLinkDTO
}
