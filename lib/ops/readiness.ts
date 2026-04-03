import "server-only"

import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { inspectStorageBootstrapState } from "@/lib/storage/supabase"

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

export interface WorkerEvent {
  id: string
  status: string
  source: string
  detail: string
  occurredAt: string
}

export interface ReadinessDashboard {
  cards: ReadinessCard[]
  lastWorkerActivity: WorkerActivity | null
  workerEvents: WorkerEvent[]
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

async function getStorageReadinessCards() {
  try {
    const snapshot = await inspectStorageBootstrapState()
    const storageConfigured = readinessCard(
      "storage",
      "Storage configured",
      snapshot.configured ? "ready" : "not_ready",
      snapshot.driver === "test" ? "Test driver" : asReadyLabel(snapshot.configured),
      snapshot.driver === "test" && snapshot.configured
        ? "Test storage driver is active for local QA and E2E uploads."
        : snapshot.driver === "test"
          ? "Test storage driver is not allowed in production."
        : snapshot.driver === "supabase"
          ? "Supabase Storage credentials are present for uploads, downloads, cleanup, and bucket verification."
          : "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.",
    )

    const bucketCards = snapshot.buckets.map((bucket) =>
      readinessCard(
        bucket.bucket,
        bucket.label,
        bucket.exists && bucket.visibility === bucket.expectedVisibility ? "ready" : "not_ready",
        bucket.exists ? bucket.visibility : "missing",
        bucket.detail,
      ),
    )

    return [storageConfigured, ...bucketCards]
  } catch (error) {
    return [
      readinessCard(
        "storage",
        "Storage configured",
        "not_ready",
        "Unavailable",
        formatError(error),
      ),
    ]
  }
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

async function findRecentWorkerEvents(limit = 12): Promise<WorkerEvent[]> {
  const [webhookDeliveries, newsletterCampaigns, newsletterDeliveries] = await Promise.allSettled([
    prisma.webhookDelivery.findMany({
      take: limit,
      orderBy: [{ deliveredAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        eventType: true,
        status: true,
        attempts: true,
        deliveredAt: true,
        nextRetryAt: true,
        createdAt: true,
      },
    }),
    prisma.newsletterCampaign.findMany({
      take: limit,
      orderBy: [{ completedAt: "desc" }, { startedAt: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        subject: true,
        status: true,
        startedAt: true,
        completedAt: true,
        updatedAt: true,
      },
    }),
    prisma.newsletterDelivery.findMany({
      take: limit,
      orderBy: [{ sentAt: "desc" }, { processingAt: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        email: true,
        status: true,
        processingAt: true,
        sentAt: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ])

  const events: WorkerEvent[] = []

  if (webhookDeliveries.status === "fulfilled") {
    for (const delivery of webhookDeliveries.value) {
      const occurredAt = delivery.deliveredAt ?? delivery.nextRetryAt ?? delivery.createdAt
      events.push({
        id: `webhook-${delivery.id}`,
        status: delivery.status,
        source: "webhook",
        detail: `${delivery.eventType} attempt=${delivery.attempts}`,
        occurredAt: occurredAt.toISOString(),
      })
    }
  }

  if (newsletterCampaigns.status === "fulfilled") {
    for (const campaign of newsletterCampaigns.value) {
      const occurredAt = campaign.completedAt ?? campaign.startedAt ?? campaign.updatedAt
      events.push({
        id: `campaign-${campaign.id}`,
        status: campaign.status,
        source: "newsletter",
        detail: `campaign "${campaign.subject}"`,
        occurredAt: occurredAt.toISOString(),
      })
    }
  }

  if (newsletterDeliveries.status === "fulfilled") {
    for (const delivery of newsletterDeliveries.value) {
      const occurredAt = delivery.sentAt ?? delivery.processingAt ?? delivery.updatedAt ?? delivery.createdAt
      events.push({
        id: `delivery-${delivery.id}`,
        status: delivery.status,
        source: "worker",
        detail: `delivery ${delivery.email}`,
        occurredAt: occurredAt.toISOString(),
      })
    }
  }

  return events.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).slice(0, limit)
}

export async function getAdminReadinessDashboard(): Promise<ReadinessDashboard> {
  const [database, storageCards, lastWorkerActivity, workerEvents] = await Promise.all([
    checkDatabaseReachable(),
    getStorageReadinessCards(),
    findLastWorkerActivity(),
    findRecentWorkerEvents(),
  ])

  return {
    cards: [
      database,
      checkAuthConfigured(),
      ...storageCards,
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
    workerEvents,
  }
}
