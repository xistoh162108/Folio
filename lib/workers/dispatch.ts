import "server-only"

import { env } from "@/lib/env"
import { getCanonicalAppUrl } from "@/lib/runtime/origin"

export async function kickWorkerRoute(
  path: "/api/worker/webhook" | "/api/worker/newsletter" | "/api/worker/asset-cleanup",
) {
  try {
    const baseUrl = getCanonicalAppUrl()
    const response = await fetch(new URL(path, baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CRON_SECRET}`,
      },
      cache: "no-store",
    })

    return response.ok
  } catch (error) {
    console.warn(`[worker:kick] failed to dispatch ${path}`, error)
    return false
  }
}
