import "server-only"

import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"

export type ReadinessStatus = "ready" | "not_ready" | "unknown"

export interface ReadinessCard {
  key: string
  label: string
  status: ReadinessStatus
  value: string
  detail: string
}

export interface WorkerActivity {
  label: string
  source: string
  occurredAt: string
}

export interface ReadinessDashboard {
  cards: ReadinessCard[]
  lastWorkerActivity: WorkerActivity | null
}

function readinessCard(
  key: string,
  label: string,
  status: ReadinessStatus,
  value: string,
  detail: string,
): ReadinessCard {
  return { key, label, status, value, detail }
}

function asReadyLabel(isReady: boolean) {
  return isReady ? "Ready" : "Not ready"
}

function formatError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unavailable."
}

async function checkDatabaseReachable() {
  try {
    await prisma.$queryRaw`SELECT 1`

    return readinessCard(
      "database",
      "DB reachable",
      "ready",
      "Connected",
      "Prisma can execute a live read against PostgreSQL.",
    )
  } catch (error) {
    return readinessCard(
      "database",
      "DB reachable",
      "not_ready",
      "Unavailable",
      formatError(error),
    )
  }
}

function checkAuthConfigured() {
  const isReady = Boolean(env.NEXTAUTH_SECRET && env.NEXTAUTH_URL)

  return readinessCard(
    "auth",
    "Auth configured",
    isReady ? "ready" : "not_ready",
    asReadyLabel(isReady),
    isReady
      ? "NextAuth secret and canonical URL are present."
      : "NEXTAUTH_SECRET or NEXTAUTH_URL is missing.",
  )
}

function checkStorageConfigured() {
  const isTestDriver = env.STORAGE_DRIVER === "test"
  const isReady = isTestDriver || Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)

  return readinessCard(
    "storage",
    "Storage configured",
    isReady ? "ready" : "not_ready",
    asReadyLabel(isReady),
    isTestDriver
      ? "Test storage driver is active for local QA and E2E uploads."
      : isReady
      ? "Supabase Storage credentials are present for uploads, downloads, and cleanup."
      : "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
  )
}

function checkEmailConfigured() {
  const isTestDriver = env.EMAIL_DRIVER === "test"
  const isReady = isTestDriver || Boolean(env.EMAIL_FROM && env.RESEND_API_KEY && env.APP_URL)

  return readinessCard(
    "email",
    "Email configured",
    isReady ? "ready" : "not_ready",
    asReadyLabel(isReady),
    isTestDriver
      ? "Test email driver is active for local QA and E2E verification."
      : isReady
      ? "Transactional email can use Resend with the configured sender identity and app URL."
      : "EMAIL_FROM, RESEND_API_KEY, or APP_URL is missing.",
  )
}

function checkWebhookConfigured() {
  const isReady = Boolean(env.OPS_WEBHOOK_URL)

  return readinessCard(
    "webhook",
    "Webhook configured",
    isReady ? "ready" : "not_ready",
    asReadyLabel(isReady),
    env.OPS_WEBHOOK_URL?.startsWith("test://")
      ? "Test webhook sink is active for local QA and E2E verification."
      : isReady
      ? "Operational webhook delivery is pointed at an external endpoint."
      : "OPS_WEBHOOK_URL is missing. Production contact delivery should fail closed until it is set.",
  )
}

function checkWorkerRoutesConfigured() {
  const isReady = Boolean(env.CRON_SECRET)

  return readinessCard(
    "worker-routes",
    "Worker routes ready",
    isReady ? "ready" : "not_ready",
    asReadyLabel(isReady),
    isReady
      ? "Webhook, newsletter, and asset-cleanup routes are mounted and can be scheduled."
      : "CRON_SECRET is missing, so worker routes cannot be scheduled safely.",
  )
}

async function findLastWorkerActivity(): Promise<WorkerActivity | null> {
  const [webhookDelivery, newsletterCampaign, newsletterDelivery] = await Promise.allSettled([
    prisma.webhookDelivery.findFirst({
      orderBy: [{ deliveredAt: "desc" }, { createdAt: "desc" }],
      select: {
        eventType: true,
        status: true,
        deliveredAt: true,
        createdAt: true,
      },
    }),
    prisma.newsletterCampaign.findFirst({
      orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        subject: true,
        status: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    }),
    prisma.newsletterDelivery.findFirst({
      orderBy: [{ sentAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }],
      select: {
        email: true,
        status: true,
        sentAt: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ])

  const candidates: WorkerActivity[] = []

  if (webhookDelivery.status === "fulfilled" && webhookDelivery.value) {
    const activityAt = webhookDelivery.value.deliveredAt ?? webhookDelivery.value.createdAt
    candidates.push({
      label: `Webhook delivery ${webhookDelivery.value.status.toLowerCase()}`,
      source: webhookDelivery.value.eventType,
      occurredAt: activityAt.toISOString(),
    })
  }

  if (newsletterCampaign.status === "fulfilled" && newsletterCampaign.value) {
    const activityAt = newsletterCampaign.value.completedAt ?? newsletterCampaign.value.startedAt ?? newsletterCampaign.value.updatedAt
    candidates.push({
      label: `Campaign ${newsletterCampaign.value.status.toLowerCase()}`,
      source: newsletterCampaign.value.subject,
      occurredAt: activityAt.toISOString(),
    })
  }

  if (newsletterDelivery.status === "fulfilled" && newsletterDelivery.value) {
    const activityAt = newsletterDelivery.value.sentAt ?? newsletterDelivery.value.updatedAt ?? newsletterDelivery.value.createdAt
    candidates.push({
      label: `Delivery ${newsletterDelivery.value.status.toLowerCase()}`,
      source: newsletterDelivery.value.email,
      occurredAt: activityAt.toISOString(),
    })
  }

  if (candidates.length === 0) {
    return null
  }

  return candidates.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0] ?? null
}

export async function getAdminReadinessDashboard(): Promise<ReadinessDashboard> {
  const [database, lastWorkerActivity] = await Promise.all([checkDatabaseReachable(), findLastWorkerActivity()])

  return {
    cards: [
      database,
      checkAuthConfigured(),
      checkStorageConfigured(),
      checkEmailConfigured(),
      checkWebhookConfigured(),
      checkWorkerRoutesConfigured(),
      readinessCard(
        "last-worker-activity",
        "Last worker activity",
        lastWorkerActivity ? "ready" : "unknown",
        lastWorkerActivity ? new Date(lastWorkerActivity.occurredAt).toLocaleString() : "No recorded activity",
        lastWorkerActivity
          ? `${lastWorkerActivity.label} from ${lastWorkerActivity.source}.`
          : "No persisted webhook or newsletter activity has been recorded yet.",
      ),
    ],
    lastWorkerActivity,
  }
}
