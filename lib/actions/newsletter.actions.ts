"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import type { CreateCampaignInput, StartCampaignInput, TestSendInput } from "@/lib/contracts/newsletter"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { getEmailBaseUrl, isEmailDeliveryConfigured, sendTestEmail, sendTransactionalEmail } from "@/lib/email/provider"
import { buildTestEmail } from "@/lib/email/templates/test-email"
import { buildUnsubscribeEmail } from "@/lib/email/templates/unsubscribe"
import { getEligibleSubscribers, normalizeTopicFilters, refreshCampaignAggregates } from "@/lib/newsletter/service"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { kickWorkerRoute } from "@/lib/workers/dispatch"

const CreateCampaignSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  html: z.string().trim().min(1, "HTML body is required."),
  text: z.string().optional(),
  topics: z.array(z.string()).default(["all-seeds"]),
  subscriberIds: z.array(z.string()).optional(),
})

const StartCampaignSchema = z.object({
  campaignId: z.string().min(1),
  resendMode: z.enum(["pending-only", "unsent-only", "all"]).default("pending-only"),
})

const TestSendSchema = z.object({
  email: z.string().email(),
  subject: z.string().trim().min(1),
  html: z.string().trim().min(1),
  text: z.string().optional(),
})

const DeliveryMutationSchema = z.object({
  deliveryId: z.string().min(1),
})

async function withAdminRateLimit() {
  const user = await requireUser()
  const headerList = await headers()
  assertRateLimit({
    namespace: "newsletter-admin-action",
    identifier: `${user.id}:${getClientIp(headerList)}`,
    limit: 20,
    windowMs: 60 * 1000,
  })
}

export async function createCampaign(input: CreateCampaignInput) {
  await withAdminRateLimit()

  try {
    const validated = CreateCampaignSchema.parse(input)
    const explicitSubscriberIds = [...new Set(validated.subscriberIds ?? [])]
    const normalizedTopics = normalizeTopicFilters(validated.topics)

    const subscribers =
      explicitSubscriberIds.length > 0
        ? await prisma.subscriber.findMany({
            where: {
              id: { in: explicitSubscriberIds },
              isConfirmed: true,
              unsubscribedAt: null,
            },
            select: { id: true, email: true },
            orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
          })
        : await getEligibleSubscribers(normalizedTopics)

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.newsletterCampaign.create({
        data: {
          subject: validated.subject,
          html: validated.html,
          text: validated.text,
          targetTopics: explicitSubscriberIds.length > 0 ? ["selected-subscribers"] : normalizedTopics,
          totalRecipients: subscribers.length,
        },
      })

      if (subscribers.length > 0) {
        await tx.newsletterDelivery.createMany({
          data: subscribers.map((subscriber, index) => ({
            campaignId: created.id,
            subscriberId: subscriber.id,
            email: subscriber.email,
            queueOrder: index,
          })),
        })
      }

      return created
    })

    await refreshCampaignAggregates(campaign.id)

    return { success: true, campaignId: campaign.id, message: "Campaign created." }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isMissingTableError(error, "NewsletterCampaign") || isMissingTableError(error, "NewsletterDelivery")) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create newsletter campaign.",
    }
  }
}

export async function startCampaign(input: StartCampaignInput) {
  await withAdminRateLimit()

  try {
    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = StartCampaignSchema.parse(input)
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: validated.campaignId },
      select: {
        id: true,
        status: true,
      },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found." }
    }

    if (validated.resendMode !== "pending-only") {
      await prisma.newsletterDelivery.updateMany({
        where: {
          campaignId: campaign.id,
          ...(validated.resendMode === "unsent-only" ? { status: "FAILED" } : {}),
        },
        data: {
          status: "PENDING",
          errorMessage: null,
          processingAt: null,
          sentAt: validated.resendMode === "all" ? null : undefined,
        },
      })
    }

    const pending = await prisma.newsletterDelivery.count({
      where: {
        campaignId: campaign.id,
        status: "PENDING",
      },
    })

    if (pending === 0) {
      return { success: false, error: "Campaign has no pending deliveries." }
    }

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        startedAt: campaign.status === "DRAFT" ? new Date() : undefined,
        completedAt: null,
        lastError: null,
      },
    })

    const dispatched = await kickWorkerRoute("/api/worker/newsletter")

    return {
      success: true,
      message: dispatched ? "Campaign started and worker dispatch was triggered." : "Campaign started. Await worker execution.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isMissingTableError(error, "NewsletterCampaign") || isMissingTableError(error, "NewsletterDelivery")) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start campaign.",
    }
  }
}

export async function sendTestCampaign(input: TestSendInput) {
  await withAdminRateLimit()

  try {
    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = TestSendSchema.parse(input)
    const result = await sendTestEmail({
      to: validated.email,
      ...buildTestEmail({
        subject: validated.subject,
        html: validated.html,
        text: validated.text,
      }),
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
      }
    }

    return {
      success: true,
      message: result.provider === "test" ? "Test email written to the local outbox." : "Test email sent.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send test email.",
    }
  }
}

export async function retryDelivery(deliveryId: string) {
  await withAdminRateLimit()

  try {
    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = DeliveryMutationSchema.parse({ deliveryId })
    const delivery = await prisma.newsletterDelivery.findUnique({
      where: { id: validated.deliveryId },
      select: {
        id: true,
        campaignId: true,
      },
    })

    if (!delivery) {
      return { success: false, error: "Delivery not found." }
    }

    await prisma.$transaction(async (tx) => {
      await tx.newsletterDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "PENDING",
          errorMessage: null,
          processingAt: null,
          sentAt: null,
        },
      })

      await tx.newsletterCampaign.update({
        where: { id: delivery.campaignId },
        data: {
          status: "SENDING",
          completedAt: null,
          lastError: null,
        },
      })
    })

    await refreshCampaignAggregates(delivery.campaignId)

    const dispatched = await kickWorkerRoute("/api/worker/newsletter")

    return {
      success: true,
      message: dispatched ? "Delivery returned to the queue and worker dispatch was triggered." : "Delivery returned to the queue.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isMissingTableError(error, "NewsletterCampaign") || isMissingTableError(error, "NewsletterDelivery")) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retry delivery.",
    }
  }
}

export async function moveDeliveryInQueue(deliveryId: string, direction: "up" | "down") {
  await withAdminRateLimit()

  try {
    const current = await prisma.newsletterDelivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, campaignId: true, queueOrder: true },
    })

    if (!current) {
      return { success: false, error: "Delivery not found." }
    }

    const neighbor = await prisma.newsletterDelivery.findFirst({
      where: {
        campaignId: current.campaignId,
        status: "PENDING",
        ...(direction === "up" ? { queueOrder: { lt: current.queueOrder } } : { queueOrder: { gt: current.queueOrder } }),
      },
      orderBy: [{ queueOrder: direction === "up" ? "desc" : "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true, queueOrder: true },
    })

    if (!neighbor) {
      return { success: false, error: `Cannot move ${direction}.` }
    }

    await prisma.$transaction([
      prisma.newsletterDelivery.update({ where: { id: current.id }, data: { queueOrder: neighbor.queueOrder } }),
      prisma.newsletterDelivery.update({ where: { id: neighbor.id }, data: { queueOrder: current.queueOrder } }),
    ])

    return { success: true, message: `Queue order updated (${direction}).` }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to reorder queue." }
  }
}

export async function editDeliveryRecipient(deliveryId: string, email: string) {
  await withAdminRateLimit()

  try {
    await prisma.newsletterDelivery.update({
      where: { id: deliveryId },
      data: {
        email: email.trim().toLowerCase(),
      },
    })
    return { success: true, message: "Recipient updated." }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to edit recipient." }
  }
}

export async function removeDeliveryFromQueue(deliveryId: string) {
  await withAdminRateLimit()

  try {
    const delivery = await prisma.newsletterDelivery.findUnique({ where: { id: deliveryId }, select: { campaignId: true } })
    if (!delivery) {
      return { success: false, error: "Delivery not found." }
    }

    await prisma.newsletterDelivery.delete({ where: { id: deliveryId } })
    await refreshCampaignAggregates(delivery.campaignId)

    return { success: true, message: "Delivery removed from queue." }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to remove delivery." }
  }
}

export async function adminUnsubscribeSubscriber(subscriberId: string) {
  await withAdminRateLimit()

  try {
    const subscriber = await prisma.subscriber.findUnique({ where: { id: subscriberId } })
    if (!subscriber) {
      return { success: false, error: "Subscriber not found." }
    }

    if (subscriber.unsubscribedAt) {
      return { success: false, error: "Subscriber is already unsubscribed." }
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        unsubscribedAt: new Date(),
      },
    })

    if (isEmailDeliveryConfigured()) {
      const baseUrl = getEmailBaseUrl()
      void sendTransactionalEmail({
        to: subscriber.email,
        ...buildUnsubscribeEmail({
          homeUrl: baseUrl,
          resubscribeUrl: new URL("/#newsletter", baseUrl).toString(),
        }),
      })
    }

    return { success: true, message: "Subscriber unsubscribed and notified." }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to unsubscribe subscriber." }
  }
}
