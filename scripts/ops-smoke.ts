import { randomUUID } from "crypto"

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env")
  } catch {
    // Allow explicit shell-provided env to win when .env is absent.
  }
}

const appUrl = process.env.APP_URL
const cronSecret = process.env.CRON_SECRET

if (!appUrl) {
  throw new Error("APP_URL is required to run ops smoke checks.")
}

if (!cronSecret) {
  throw new Error("CRON_SECRET is required to run ops smoke checks.")
}

type SmokeResult = {
  name: string
  ok: boolean
  detail: string
}

async function checkRoute(path: string, expectedStatus: number) {
  const response = await fetch(new URL(path, appUrl), {
    redirect: "manual",
  })

  return {
    ok: response.status === expectedStatus,
    detail: `expected ${expectedStatus}, got ${response.status}`,
  }
}

async function checkAnalytics(): Promise<SmokeResult> {
  const response = await fetch(new URL("/api/analytics", appUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventType: "PAGEVIEW",
      sessionId: `ops-smoke-${randomUUID()}`,
      path: "/",
      occurredAt: new Date().toISOString(),
    }),
  })

  const body = await response.text()
  return {
    name: "POST /api/analytics",
    ok: response.ok,
    detail: `${response.status} ${body}`,
  }
}

async function checkWorker(path: "/api/worker/webhook" | "/api/worker/newsletter" | "/api/worker/asset-cleanup"): Promise<SmokeResult> {
  const response = await fetch(new URL(path, appUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  })

  const body = await response.text()
  return {
    name: `POST ${path}`,
    ok: response.ok,
    detail: `${response.status} ${body}`,
  }
}

async function main() {
  const checks: SmokeResult[] = []

  const home = await checkRoute("/", 200)
  checks.push({ name: "GET /", ...home })

  const adminLogin = await checkRoute("/admin/login", 200)
  checks.push({ name: "GET /admin/login", ...adminLogin })

  checks.push(await checkAnalytics())
  checks.push(await checkWorker("/api/worker/webhook"))
  checks.push(await checkWorker("/api/worker/asset-cleanup"))
  checks.push(await checkWorker("/api/worker/newsletter"))

  const failed = checks.filter((check) => !check.ok)

  for (const check of checks) {
    const marker = check.ok ? "PASS" : "FAIL"
    console.log(`[${marker}] ${check.name} -> ${check.detail}`)
  }

  if (failed.length > 0) {
    process.exitCode = 1
    return
  }

  console.log("Ops smoke checks passed. Worker 200 responses may represent processed work or empty-queue no-op success.")
}

void main()
