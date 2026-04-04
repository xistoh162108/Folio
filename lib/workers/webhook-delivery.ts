import type { ContactSubmitWebhookPayload } from "@/lib/contracts/webhooks"
import { env } from "@/lib/env"

export const WEBHOOK_REQUEST_TIMEOUT_MS = 8_000
const WEBHOOK_RESPONSE_SNIPPET_LIMIT = 240

function truncateWebhookSnippet(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= WEBHOOK_RESPONSE_SNIPPET_LIMIT) {
    return normalized
  }

  return `${normalized.slice(0, WEBHOOK_RESPONSE_SNIPPET_LIMIT - 1)}…`
}

export function isPlaceholderWebhookDestination(destination: string) {
  if (!/^https?:\/\//.test(destination)) {
    return false
  }

  try {
    const hostname = new URL(destination).hostname.toLowerCase()
    return hostname === "your-ops-endpoint.example" || hostname.endsWith(".example")
  } catch {
    return false
  }
}

export function resolveWebhookDispatchTarget(
  storedDestination: string,
  configuredDestination: string | null | undefined = env.OPS_WEBHOOK_URL,
) {
  const configured = configuredDestination?.trim() || null

  if (configured) {
    if (isPlaceholderWebhookDestination(configured)) {
      return {
        destination: configured,
        source: "env" as const,
        staleStoredDestination: configured === storedDestination ? null : storedDestination,
        configError: "OPS_WEBHOOK_URL still points to a placeholder host.",
      }
    }

    return {
      destination: configured,
      source: "env" as const,
      staleStoredDestination: configured === storedDestination ? null : storedDestination,
      configError: null,
    }
  }

  if (isPlaceholderWebhookDestination(storedDestination)) {
    return {
      destination: storedDestination,
      source: "stored" as const,
      staleStoredDestination: null,
      configError: "Stored ops webhook destination is still a placeholder host.",
    }
  }

  return {
    destination: storedDestination,
    source: "stored" as const,
    staleStoredDestination: null,
    configError: null,
  }
}

export function classifyWebhookDispatchError(
  error: unknown,
  destination: string,
  staleStoredDestination?: string | null,
) {
  const hostname = /^https?:\/\//.test(destination) ? new URL(destination).hostname : destination
  const staleDetail = staleStoredDestination ? ` stored=${staleStoredDestination}` : ""

  if (error instanceof Error && error.name === "AbortError") {
    return `Webhook request timed out after ${WEBHOOK_REQUEST_TIMEOUT_MS}ms to ${hostname}.${staleDetail}`
  }

  const message = error instanceof Error && error.message.trim() ? error.message.trim() : "Unknown execution error"
  return `${message} [target=${hostname}${staleDetail}]`
}

export async function dispatchWebhookRequest(
  destination: string,
  payload: ContactSubmitWebhookPayload,
  fetchImpl: typeof fetch = fetch,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetchImpl(destination, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const responseBody = truncateWebhookSnippet(await response.text())
      const hostname = new URL(destination).hostname
      throw new Error(
        responseBody
          ? `Webhook request failed with ${response.status} from ${hostname}: ${responseBody}`
          : `Webhook request failed with ${response.status} from ${hostname}`,
      )
    }
  } finally {
    clearTimeout(timeout)
  }
}
