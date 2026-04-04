"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import type {
  AdminSubscriberActionInput,
  DeleteCampaignInput,
  RemoveNewsletterAssetInput,
  ReorderCampaignInput,
  RerunCampaignInput,
  StartCampaignInput,
  TestSendInput,
  ToggleNewsletterAssetAttachmentInput,
  UpsertCampaignInput,
} from "@/lib/contracts/newsletter"
import { isMissingColumnError, isMissingRecordError, isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { getEmailBaseUrl, isEmailDeliveryConfigured, sendTestEmail, sendTransactionalEmail } from "@/lib/email/provider"
import { buildNewsletterEmail } from "@/lib/email/templates/newsletter"
import { buildUnsubscribeEmail } from "@/lib/email/templates/unsubscribe"
import { buildNewsletterComposePayload } from "@/lib/newsletter/compose"
import { ensureNewsletterTopics, getEligibleSubscribers, normalizeTopicFilters, refreshCampaignAggregates } from "@/lib/newsletter/service"
import type { NewsletterVisibleTopic } from "@/lib/newsletter/topics"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { deleteAssetFromSupabase, downloadAssetFromSupabase } from "@/lib/storage/supabase"
import { kickWorkerRoute } from "@/lib/workers/dispatch"

const UpsertCampaignSchema = z.object({
  id: z.string().min(1).optional(),
  subject: z.string().trim().min(1, "Subject is required."),
  markdown: z.string().trim().min(1, "Body is required."),
  topics: z.array(z.enum(["all", "project-info", "log"])).default(["all"]),
  recipientMode: z.enum(["TOPICS", "SELECTED_SUBSCRIBERS"]).default("TOPICS"),
  targetSubscriberIds: z.array(z.string().min(1)).default([]),
  skipPreviouslySent: z.boolean().default(false),
})

const CampaignIdSchema = z.object({
  campaignId: z.string().min(1),
})

const ReorderCampaignSchema = z.object({
  campaignId: z.string().min(1),
  direction: z.enum(["up", "down"]),
})

const TestSendSchema = z.object({
  email: z.string().email(),
  subject: z.string().trim().min(1),
  markdown: z.string().trim().min(1),
  assetIds: z.array(z.string().min(1)).optional(),
})

const AssetIdSchema = z.object({
  assetId: z.string().min(1),
})

const ToggleAssetAttachmentSchema = z.object({
  assetId: z.string().min(1),
  sendAsAttachment: z.boolean(),
})

const SubscriberIdSchema = z.object({
  subscriberId: z.string().min(1),
})

async function assertNewsletterAdminRateLimit(userId: string) {
  const headerList = await headers()
  assertRateLimit({
    namespace: "newsletter-admin-action",
    identifier: `${userId}:${getClientIp(headerList)}`,
    limit: 20,
    windowMs: 60 * 1000,
  })
}

function isNewsletterMigrationError(error: unknown) {
  return (
    isMissingTableError(error, "NewsletterCampaign") ||
    isMissingTableError(error, "NewsletterDelivery") ||
    isMissingTableError(error, "NewsletterAsset") ||
    isMissingColumnError(error, "NewsletterCampaign.markdown") ||
    isMissingColumnError(error, "NewsletterCampaign.queueOrder") ||
    isMissingColumnError(error, "NewsletterCampaign.recipientMode") ||
    isMissingColumnError(error, "NewsletterCampaign.targetSubscriberIds") ||
    isMissingColumnError(error, "NewsletterCampaign.skipPreviouslySent")
  )
}

async function loadNewsletterAttachments(assetIds: string[] | undefined): Promise<Array<{ filename: string; content: Buffer; contentType?: string }>> {
  const normalizedAssetIds = [...new Set((assetIds ?? []).filter(Boolean))]

  if (normalizedAssetIds.length === 0) {
    return []
  }

  const assets = await prisma.newsletterAsset.findMany({
    where: {
      id: {
        in: normalizedAssetIds,
      },
      sendAsAttachment: true,
    },
    select: {
      id: true,
      bucket: true,
      storagePath: true,
      originalName: true,
      mime: true,
    },
  })

  const attachments: Array<{ filename: string; content: Buffer; contentType?: string } | null> = await Promise.all(
    assets.map(async (asset) => {
      const downloaded = await downloadAssetFromSupabase(asset.bucket, asset.storagePath)

      if (!downloaded) {
        return null
      }

      return {
        filename: asset.originalName,
        content: downloaded.buffer,
        contentType: downloaded.contentType ?? asset.mime,
      }
    }),
  )

  return attachments.flatMap((attachment) => (attachment ? [attachment] : []))
}

async function syncDraftDeliveries(input: {
  campaignId: string
  recipientMode: "TOPICS" | "SELECTED_SUBSCRIBERS"
  topics: NewsletterVisibleTopic[]
  targetSubscriberIds: string[]
}) {
  const recipients = await getEligibleSubscribers({
    topics: input.topics,
    recipientMode: input.recipientMode,
    targetSubscriberIds: input.targetSubscriberIds,
  })

  await prisma.$transaction(async (tx) => {
    await tx.newsletterDelivery.deleteMany({
      where: { campaignId: input.campaignId },
    })

    if (recipients.length > 0) {
      await tx.newsletterDelivery.createMany({
        data: recipients.map((subscriber) => ({
          campaignId: input.campaignId,
          subscriberId: subscriber.id,
          email: subscriber.email,
        })),
      })
    }

    await tx.newsletterCampaign.update({
      where: { id: input.campaignId },
      data: {
        totalRecipients: recipients.length,
        sentCount: 0,
        failedCount: 0,
        completedAt: null,
        lastError: null,
      },
    })
  })

  return recipients
}

async function prepareRerunDeliveries(input: {
  campaignId: string
  recipientMode: "TOPICS" | "SELECTED_SUBSCRIBERS"
  topics: NewsletterVisibleTopic[]
  targetSubscriberIds: string[]
  skipPreviouslySent: boolean
}) {
  const recipients = await getEligibleSubscribers({
    topics: input.topics,
    recipientMode: input.recipientMode,
    targetSubscriberIds: input.targetSubscriberIds,
  })

  const existingDeliveries = await prisma.newsletterDelivery.findMany({
    where: { campaignId: input.campaignId },
    select: {
      id: true,
      email: true,
      status: true,
      subscriberId: true,
    },
  })

  const existingByEmail = new Map(existingDeliveries.map((delivery) => [delivery.email, delivery]))
  const resetIds: string[] = []
  const createRows: Array<{ campaignId: string; subscriberId: string | null; email: string }> = []

  for (const recipient of recipients) {
    const existing = existingByEmail.get(recipient.email)

    if (!existing) {
      createRows.push({
        campaignId: input.campaignId,
        subscriberId: recipient.id,
        email: recipient.email,
      })
      continue
    }

    if (input.skipPreviouslySent && existing.status === "SENT") {
      continue
    }

    resetIds.push(existing.id)
  }

  await prisma.$transaction(async (tx) => {
    if (resetIds.length > 0) {
      await tx.newsletterDelivery.updateMany({
        where: {
          id: {
            in: resetIds,
          },
        },
        data: {
          status: "PENDING",
          errorMessage: null,
          processingAt: null,
          sentAt: null,
        },
      })
    }

    if (createRows.length > 0) {
      await tx.newsletterDelivery.createMany({
        data: createRows,
      })
    }

    await tx.newsletterCampaign.update({
      where: { id: input.campaignId },
      data: {
        status: "SENDING",
        startedAt: new Date(),
        completedAt: null,
        lastError: null,
      },
    })
  })

  return {
    recipients,
    pendingCount: resetIds.length + createRows.length,
  }
}

async function dispatchNewsletterWorker() {
  return kickWorkerRoute("/api/worker/newsletter")
}

async function deleteCampaignAssetsFromStorage(
  assets: Array<{ bucket: string; storagePath: string }>,
) {
  const results = await Promise.allSettled(
    assets.map((asset) => deleteAssetFromSupabase(asset.bucket, asset.storagePath)),
  )

  return {
    failedCount: results.filter((result) => result.status === "rejected").length,
  }
}

export async function upsertCampaign(input: UpsertCampaignInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    await ensureNewsletterTopics()

    const validated = UpsertCampaignSchema.parse(input)
    const normalizedTopics = normalizeTopicFilters(validated.topics)
    const rendered = buildNewsletterComposePayload(validated.markdown)

    const campaignId = await prisma.$transaction(async (tx) => {
      if (validated.id) {
        const existing = await tx.newsletterCampaign.findUnique({
          where: { id: validated.id },
          select: { id: true, status: true },
        })

        if (!existing) {
          throw new Error("Campaign not found.")
        }

        if (existing.status !== "DRAFT") {
          throw new Error("Only queued draft campaigns can be edited.")
        }

        await tx.newsletterCampaign.update({
          where: { id: existing.id },
          data: {
            subject: validated.subject,
            markdown: rendered.markdownSource,
            html: rendered.html,
            text: rendered.text,
            targetTopics: normalizedTopics,
            recipientMode: validated.recipientMode,
            targetSubscriberIds: validated.targetSubscriberIds,
            skipPreviouslySent: validated.skipPreviouslySent,
          },
        })

        return existing.id
      }

      const maxQueueOrder = await tx.newsletterCampaign.aggregate({
        _max: { queueOrder: true },
      })

      const created = await tx.newsletterCampaign.create({
        data: {
          subject: validated.subject,
          markdown: rendered.markdownSource,
          html: rendered.html,
          text: rendered.text,
          targetTopics: normalizedTopics,
          recipientMode: validated.recipientMode,
          targetSubscriberIds: validated.targetSubscriberIds,
          skipPreviouslySent: validated.skipPreviouslySent,
          queueOrder: (maxQueueOrder._max.queueOrder ?? -1) + 1,
        },
        select: { id: true },
      })

      return created.id
    })

    const recipients = await syncDraftDeliveries({
      campaignId,
      recipientMode: validated.recipientMode,
      topics: normalizedTopics,
      targetSubscriberIds: validated.targetSubscriberIds,
    })

    return {
      success: true,
      campaignId,
      message: `Draft queued for ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.`,
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save newsletter campaign.",
    }
  }
}

export async function startCampaign(input: StartCampaignInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = CampaignIdSchema.parse(input)
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: validated.campaignId },
      select: {
        id: true,
        status: true,
        targetTopics: true,
        recipientMode: true,
        targetSubscriberIds: true,
      },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found." }
    }

    if (campaign.status === "SENDING") {
      return { success: false, error: "Campaign is already sending." }
    }

    const recipients = await syncDraftDeliveries({
      campaignId: campaign.id,
      recipientMode: campaign.recipientMode,
      topics: normalizeTopicFilters(campaign.targetTopics),
      targetSubscriberIds: campaign.targetSubscriberIds,
    })

    if (recipients.length === 0) {
      return { success: false, error: "Campaign has no eligible recipients." }
    }

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        startedAt: new Date(),
        completedAt: null,
        lastError: null,
      },
    })

    const dispatched = await dispatchNewsletterWorker()

    return {
      success: true,
      message: dispatched ? "Campaign started and worker dispatch was triggered." : "Campaign started. Await worker execution.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to start campaign.",
    }
  }
}

export async function rerunCampaign(input: RerunCampaignInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = CampaignIdSchema.parse(input)
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: validated.campaignId },
      select: {
        id: true,
        status: true,
        targetTopics: true,
        recipientMode: true,
        targetSubscriberIds: true,
        skipPreviouslySent: true,
      },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found." }
    }

    if (campaign.status === "SENDING") {
      return { success: false, error: "Campaign is already sending." }
    }

    const prepared = await prepareRerunDeliveries({
      campaignId: campaign.id,
      recipientMode: campaign.recipientMode,
      topics: normalizeTopicFilters(campaign.targetTopics),
      targetSubscriberIds: campaign.targetSubscriberIds,
      skipPreviouslySent: campaign.skipPreviouslySent,
    })

    if (prepared.pendingCount === 0) {
      return { success: false, error: "No recipients remain for this rerun." }
    }

    await refreshCampaignAggregates(campaign.id)
    const dispatched = await dispatchNewsletterWorker()

    return {
      success: true,
      message: dispatched
        ? `Campaign rerun started for ${prepared.pendingCount} pending recipient${prepared.pendingCount === 1 ? "" : "s"}.`
        : `Campaign rerun prepared for ${prepared.pendingCount} pending recipient${prepared.pendingCount === 1 ? "" : "s"}.`,
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rerun campaign.",
    }
  }
}

export async function deleteCampaign(input: DeleteCampaignInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)

    const validated = CampaignIdSchema.parse(input)
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: validated.campaignId },
      select: { id: true, status: true },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found." }
    }

    if (campaign.status === "SENDING") {
      return { success: false, error: "Stop delivery before removing a live campaign." }
    }

    const assets = await prisma.newsletterAsset.findMany({
      where: { campaignId: campaign.id },
      select: {
        bucket: true,
        storagePath: true,
      },
    })

    await prisma.newsletterCampaign.delete({
      where: { id: campaign.id },
    })

    const cleanup = await deleteCampaignAssetsFromStorage(assets)

    return {
      success: true,
      message:
        cleanup.failedCount > 0
          ? "Campaign removed. Some stored assets could not be cleaned up."
          : "Campaign removed.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete campaign.",
    }
  }
}

export async function reorderCampaign(input: ReorderCampaignInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    const validated = ReorderCampaignSchema.parse(input)

    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: validated.campaignId },
      select: {
        id: true,
        status: true,
        queueOrder: true,
      },
    })

    if (!campaign) {
      return { success: false, error: "Campaign not found." }
    }

    if (campaign.status !== "DRAFT") {
      return { success: false, error: "Only queued draft campaigns can be reordered." }
    }

    const neighbor = await prisma.newsletterCampaign.findFirst({
      where: {
        status: "DRAFT",
        ...(validated.direction === "up"
          ? { queueOrder: { lt: campaign.queueOrder } }
          : { queueOrder: { gt: campaign.queueOrder } }),
      },
      orderBy:
        validated.direction === "up"
          ? [{ queueOrder: "desc" }, { createdAt: "desc" }]
          : [{ queueOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        queueOrder: true,
      },
    })

    if (!neighbor) {
      return {
        success: true,
        message: "Queue order already at the edge.",
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.newsletterCampaign.update({
        where: { id: campaign.id },
        data: { queueOrder: neighbor.queueOrder },
      })

      await tx.newsletterCampaign.update({
        where: { id: neighbor.id },
        data: { queueOrder: campaign.queueOrder },
      })
    })

    return {
      success: true,
      message: `Campaign moved ${validated.direction}.`,
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder campaign.",
    }
  }
}

export async function sendTestCampaign(input: TestSendInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, error: "Email delivery is not configured for production." }
    }

    const validated = TestSendSchema.parse(input)
    const compose = buildNewsletterComposePayload(validated.markdown)
    const attachments = await loadNewsletterAttachments(validated.assetIds)
    const result = await sendTestEmail({
      to: validated.email,
      attachments,
      ...buildNewsletterEmail({
        subject: validated.subject,
        html: compose.html,
        text: compose.text,
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

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
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
    await assertNewsletterAdminRateLimit(user.id)

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

    const dispatched = await dispatchNewsletterWorker()

    return {
      success: true,
      message: dispatched ? "Delivery returned to the queue and worker dispatch was triggered." : "Delivery returned to the queue.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retry delivery.",
    }
  }
}

export async function unsubscribeSubscriberAsAdmin(input: AdminSubscriberActionInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    const validated = SubscriberIdSchema.parse(input)

    const subscriber = await prisma.subscriber.findUnique({
      where: { id: validated.subscriberId },
      select: {
        id: true,
        email: true,
        unsubscribeToken: true,
        unsubscribedAt: true,
      },
    })

    if (!subscriber) {
      return { success: false, error: "Subscriber not found." }
    }

    if (!subscriber.unsubscribedAt) {
      await prisma.subscriber.update({
        where: { id: subscriber.id },
        data: {
          unsubscribedAt: new Date(),
          isConfirmed: false,
        },
      })
    }

    const baseUrl = getEmailBaseUrl()
    const homeUrl = new URL("/", baseUrl).toString()
    const emailResult = await sendTransactionalEmail({
      to: subscriber.email,
      ...buildUnsubscribeEmail({
        homeUrl,
        resubscribeUrl: homeUrl,
      }),
    })

    return {
      success: true,
      message: emailResult.success
        ? "Subscriber unsubscribed."
        : "Subscriber unsubscribed. Notification email could not be sent.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unsubscribe subscriber.",
    }
  }
}

export async function deleteSubscriberAsAdmin(input: AdminSubscriberActionInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    const validated = SubscriberIdSchema.parse(input)

    await prisma.subscriber.delete({
      where: { id: validated.subscriberId },
    })

    return {
      success: true,
      message: "Subscriber deleted.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isMissingRecordError(error)) {
      return { success: false, error: "Subscriber not found." }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete subscriber.",
    }
  }
}

export async function toggleNewsletterAssetAttachment(input: ToggleNewsletterAssetAttachmentInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    const validated = ToggleAssetAttachmentSchema.parse(input)

    const asset = await prisma.newsletterAsset.findUnique({
      where: { id: validated.assetId },
      select: {
        id: true,
        campaign: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!asset) {
      return { success: false, error: "Asset not found." }
    }

    if (asset.campaign.status === "SENDING") {
      return { success: false, error: "Live campaigns cannot change attachment state." }
    }

    await prisma.newsletterAsset.update({
      where: { id: asset.id },
      data: {
        sendAsAttachment: validated.sendAsAttachment,
      },
    })

    return {
      success: true,
      message: validated.sendAsAttachment ? "Attachment armed." : "Attachment released.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update newsletter asset.",
    }
  }
}

export async function removeNewsletterAsset(input: RemoveNewsletterAssetInput) {
  const user = await requireUser()

  try {
    await assertNewsletterAdminRateLimit(user.id)
    const validated = AssetIdSchema.parse(input)

    const asset = await prisma.newsletterAsset.findUnique({
      where: { id: validated.assetId },
      select: {
        id: true,
        bucket: true,
        storagePath: true,
        campaign: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!asset) {
      return { success: false, error: "Asset not found." }
    }

    if (asset.campaign.status === "SENDING") {
      return { success: false, error: "Live campaigns cannot remove assets." }
    }

    await deleteAssetFromSupabase(asset.bucket, asset.storagePath)
    await prisma.newsletterAsset.delete({
      where: { id: asset.id },
    })

    return {
      success: true,
      message: "Asset removed.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, error: error.message }
    }

    if (isNewsletterMigrationError(error)) {
      return { success: false, error: "Newsletter migrations have not been applied yet." }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove asset.",
    }
  }
}
