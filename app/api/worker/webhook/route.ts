import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import type { ContactSubmitWebhookPayload } from "@/lib/contracts/webhooks"
import { env } from "@/lib/env"
import { appendJsonLine, TEST_WEBHOOK_SINK_PATH } from "@/lib/testing/sinks"
import {
  classifyWebhookDispatchError,
  dispatchWebhookRequest,
  resolveWebhookDispatchTarget,
} from "@/lib/workers/webhook-delivery"

const MAX_RETRIES = 5
const BATCH_SIZE = 10

async function handleWebhookWorker(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = env.CRON_SECRET
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[WEBHOOK_CRON] Blocked unauthorized execution attempt.")
    return new NextResponse("401 Unauthorized", { status: 401 })
  }

  try {
    const claimedRows = await prisma.$queryRaw<Array<{ id: string, destination: string, payload: ContactSubmitWebhookPayload, attempts: number }>>`
      UPDATE "WebhookDelivery"
      SET 
        status = 'RETRYING',
        "nextRetryAt" = NULL
      WHERE id IN (
        SELECT id FROM "WebhookDelivery"
        WHERE status IN ('PENDING', 'RETRYING')
          AND attempts < ${MAX_RETRIES}
          AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
        ORDER BY "createdAt" ASC, id ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, destination, payload, attempts;
    `;

    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json({ success: true, message: "No pending webhook jobs found." })
    }

    const results = await Promise.allSettled(
      claimedRows.map(async (job) => {
        let resolvedDestination = job.destination
        let staleStoredDestination: string | null = null

        try {
          const dispatchTarget = resolveWebhookDispatchTarget(job.destination)
          resolvedDestination = dispatchTarget.destination
          staleStoredDestination = dispatchTarget.staleStoredDestination

          console.log(`[WEBHOOK DISPATCH] Target: ${resolvedDestination}`, {
            payload: job.payload,
            source: dispatchTarget.source,
            staleStoredDestination,
          })

          if (dispatchTarget.configError) {
            throw new Error(dispatchTarget.configError)
          }

          if (resolvedDestination.startsWith("console://")) {
            console.info("[webhook:fallback]", job.payload)
          } else if (resolvedDestination.startsWith("test://")) {
            await appendJsonLine(TEST_WEBHOOK_SINK_PATH, {
              destination: resolvedDestination,
              payload: job.payload,
              deliveredAt: new Date().toISOString(),
            })
          } else if (resolvedDestination.startsWith("config://")) {
            throw new Error("Ops webhook delivery is not configured for production.")
          } else {
            await dispatchWebhookRequest(resolvedDestination, job.payload)
          }

          await prisma.webhookDelivery.update({
            where: { id: job.id },
            data: {
              status: "SUCCESS",
              deliveredAt: new Date(),
              lastError: null,
            }
          })
          
          return { id: job.id, status: "SUCCESS" }
        } catch (err: any) {
          const nextAttempts = job.attempts + 1
          const isConfigFailure =
            typeof err?.message === "string" &&
            (err.message.includes("not configured") || err.message.includes("placeholder host"))
          const hasFailed = isConfigFailure || nextAttempts >= MAX_RETRIES
          const backoffMinutes = Math.pow(2, nextAttempts)
          const lastError = classifyWebhookDispatchError(err, resolvedDestination, staleStoredDestination)
          
          await prisma.webhookDelivery.update({
            where: { id: job.id },
            data: {
              attempts: nextAttempts,
              lastError,
              status: hasFailed ? "FAILED" : "RETRYING",
              nextRetryAt: hasFailed ? null : new Date(Date.now() + backoffMinutes * 60 * 1000)
            }
          })

          throw err
        }
      })
    )

    const summary = {
      processed: claimedRows.length,
      succeeded: results.filter(r => r.status === "fulfilled").length,
      failed: results.filter(r => r.status === "rejected").length
    }

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("[CRON FATAL]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(request: Request) {
  return handleWebhookWorker(request)
}

export async function POST(request: Request) {
  return handleWebhookWorker(request)
}
