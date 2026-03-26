import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import type { ContactSubmitWebhookPayload } from "@/lib/contracts/webhooks"
import { env } from "@/lib/env"
import { appendJsonLine, TEST_WEBHOOK_SINK_PATH } from "@/lib/testing/sinks"

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
        try {
          console.log(`[WEBHOOK DISPATCH] Target: ${job.destination}`, job.payload)

          if (job.destination.startsWith("console://")) {
            console.info("[webhook:fallback]", job.payload)
          } else if (job.destination.startsWith("test://")) {
            await appendJsonLine(TEST_WEBHOOK_SINK_PATH, {
              destination: job.destination,
              payload: job.payload,
              deliveredAt: new Date().toISOString(),
            })
          } else if (job.destination.startsWith("config://")) {
            throw new Error("Ops webhook delivery is not configured for production.")
          } else {
            const response = await fetch(job.destination, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(job.payload),
            })

            if (!response.ok) {
              throw new Error(`Webhook request failed with ${response.status}`)
            }
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
          const isConfigFailure = typeof err?.message === "string" && err.message.includes("not configured")
          const hasFailed = isConfigFailure || nextAttempts >= MAX_RETRIES
          const backoffMinutes = Math.pow(2, nextAttempts)
          
          await prisma.webhookDelivery.update({
            where: { id: job.id },
            data: {
              attempts: nextAttempts,
              lastError: err.message || "Unknown execution error",
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
