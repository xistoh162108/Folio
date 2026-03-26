"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import type { CreateCampaignInput, StartCampaignInput, TestSendInput } from "@/lib/contracts/newsletter"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { isEmailDeliveryConfigured, sendTestEmail } from "@/lib/email/provider"
import { buildTestEmail } from "@/lib/email/templates/test-email"
import { getEligibleSubscribers, normalizeTopicFilters, refreshCampaignAggregates } from "@/lib/newsletter/service"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { kickWorkerRoute } from "@/lib/workers/dispatch"

const CreateCampaignSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  html: z.string().trim().min(1, "HTML body is required."),
  text: z.string().optional(),
  topics: z.array(z.string()).default(["all-seeds"]),
})

const StartCampaignSchema = z.object({
  campaignId: z.string().min(1),
})

const TestSendSchema = z.object({
  email: z.string().email(),
  subject: z.string().trim().min(1),
  html: z.string().trim().min(1),
  text: z.string().optional(),
})

export async function createCampaign(input: CreateCampaignInput) {
  const user = await requireUser()

  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "newsletter-admin-action",
      identifier: `${user.id}:${getClientIp(headerList)}`,
      limit: 20,
      windowMs: 60 * 1000,
    })

    const validated = CreateCampaignSchema.parse(input)
    const normalizedTopics = normalizeTopicFilters(validated.topics)
    const subscribers = await getEligibleSubscribers(normalizedTopics)

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.newsletterCampaign.create({
        data: {
          subject: validated.subject,
          html: validated.html,
          text: validated.text,
          targetTopics: normalizedTopics,
          totalRecipients: subscribers.length,
        },
      })

      if (subscribers.length > 0) {
        await tx.newsletterDelivery.createMany({
          data: subscribers.map((subscriber) => ({
            campaignId: created.id,
            subscriberId: subscriber.id,
            email: subscriber.email,
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
  const user = await requireUser()

  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "newsletter-admin-action",
      identifier: `${user.id}:${getClientIp(headerList)}`,
      limit: 20,
      windowMs: 60 * 1000,
    })

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
  const user = await requireUser()

  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "newsletter-admin-action",
      identifier: `${user.id}:${getClientIp(headerList)}`,
      limit: 20,
      windowMs: 60 * 1000,
    })

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
  const user = await requireUser()

  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "newsletter-admin-action",
      identifier: `${user.id}:${getClientIp(headerList)}`,
      limit: 20,
      windowMs: 60 * 1000,
    })

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const delivery = await prisma.newsletterDelivery.findUnique({
      where: { id: deliveryId },
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
