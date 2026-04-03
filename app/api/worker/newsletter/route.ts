import { NextResponse } from "next/server"

import { isMissingRelationInRawQuery, isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { getEmailBaseUrl, sendCampaignEmails } from "@/lib/email/provider"
import { buildNewsletterEmail } from "@/lib/email/templates/newsletter"
import { env } from "@/lib/env"
import { refreshCampaignAggregates } from "@/lib/newsletter/service"
import { kickWorkerRoute } from "@/lib/workers/dispatch"

const BATCH_SIZE = 20

async function handleNewsletterWorker(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  try {
    const deliveries = await prisma.$queryRaw<
      Array<{
        id: string
        campaignId: string
        email: string
        subject: string
        html: string
        text: string | null
        unsubscribeToken: string | null
      }>
    >`
      WITH claimed AS (
        UPDATE "NewsletterDelivery"
        SET "processingAt" = NOW()
        WHERE id IN (
          SELECT delivery.id
          FROM "NewsletterDelivery" AS delivery
          INNER JOIN "NewsletterCampaign" AS campaign
            ON campaign.id = delivery."campaignId"
          WHERE delivery.status = 'PENDING'
            AND (
              delivery."processingAt" IS NULL
              OR delivery."processingAt" < NOW() - INTERVAL '15 minutes'
            )
            AND campaign.status = 'SENDING'
          ORDER BY delivery."queueOrder" ASC, delivery."createdAt" ASC, delivery.id ASC
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id, "campaignId", "subscriberId", email, "createdAt", "queueOrder"
      )
      SELECT claimed.id,
             claimed."campaignId" AS "campaignId",
             claimed.email,
             campaign.subject,
             campaign.html,
             campaign.text,
             subscriber."unsubscribeToken" AS "unsubscribeToken"
      FROM claimed
      INNER JOIN "NewsletterCampaign" AS campaign
        ON campaign.id = claimed."campaignId"
      LEFT JOIN "Subscriber" AS subscriber
        ON subscriber.id = claimed."subscriberId"
      ORDER BY claimed."queueOrder" ASC, claimed."createdAt" ASC, claimed.id ASC;
    `

    if (deliveries.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    const baseUrl = getEmailBaseUrl()
    const results = await sendCampaignEmails({
      recipients: deliveries.map((delivery) => {
        const unsubscribeUrl = delivery.unsubscribeToken
          ? new URL(`/unsubscribe?token=${delivery.unsubscribeToken}`, baseUrl).toString()
          : null

        return {
          to: delivery.email,
          ...buildNewsletterEmail({
            subject: delivery.subject,
            html: delivery.html,
            text: delivery.text,
            unsubscribeUrl,
          }),
        }
      }),
    })

    await Promise.all(
      results.map(async (result, index) => {
        if (result.success) {
          await prisma.newsletterDelivery.update({
            where: { id: deliveries[index]!.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              errorMessage: null,
              processingAt: null,
            },
          })

          return
        }

        await prisma.newsletterDelivery.update({
          where: { id: deliveries[index]!.id },
          data: {
            status: "FAILED",
            errorMessage: result.error.providerMessage ?? result.error.message,
            processingAt: null,
          },
        })
      }),
    )

    const campaignIds = [...new Set(deliveries.map((delivery) => delivery.campaignId))]
    await Promise.all(campaignIds.map((campaignId) => refreshCampaignAggregates(campaignId)))
    const remaining = await prisma.newsletterDelivery.count({
      where: {
        status: "PENDING",
        campaign: {
          status: "SENDING",
        },
      },
    })

    if (remaining > 0) {
      void kickWorkerRoute("/api/worker/newsletter")
    }

    return NextResponse.json({
      success: true,
      processed: deliveries.length,
      sent: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      remaining,
    })
  } catch (error) {
    if (
      isMissingTableError(error, "NewsletterCampaign") ||
      isMissingTableError(error, "NewsletterDelivery") ||
      isMissingRelationInRawQuery(error, "NewsletterDelivery") ||
      isMissingRelationInRawQuery(error, "NewsletterCampaign")
    ) {
      return NextResponse.json(
        { error: "Newsletter migrations have not been applied yet." },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Newsletter worker failed." },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return handleNewsletterWorker(request)
}

export async function POST(request: Request) {
  return handleNewsletterWorker(request)
}
