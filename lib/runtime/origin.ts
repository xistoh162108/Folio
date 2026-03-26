import "server-only"

import { env } from "@/lib/env"

export function getCanonicalAppUrl() {
  if (env.APP_URL) {
    return env.APP_URL
  }

  if (process.env.NODE_ENV !== "production" && env.NEXTAUTH_URL) {
    return env.NEXTAUTH_URL
  }

  throw new Error("APP_URL is required in production for canonical links and worker self-dispatch.")
}
