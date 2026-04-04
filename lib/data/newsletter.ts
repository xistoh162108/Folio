import "server-only"

import type { NewsletterDashboardData, NewsletterSubscriberStatus } from "@/lib/contracts/newsletter"
import { isMissingColumnError, isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { ensureNewsletterTopics } from "@/lib/newsletter/service"
import { getNewsletterTopicDefinitions, getNewsletterTopicName, normalizeNewsletterTopics } from "@/lib/newsletter/topics"

const DEFAULT_NEWSLETTER_PAGE_SIZE = 15

function resolvePage(value: number | null | undefined) {
  return value && value > 0 ? Math.floor(value) : 1
}

function buildPagination(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  return {
    page: currentPage,
    pageSize,
    total,
    totalPages,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  }
}

function mapSubscriberStatus(input: { isConfirmed: boolean; unsubscribedAt: Date | null }): NewsletterSubscriberStatus {
  if (input.unsubscribedAt) {
    return "UNSUBSCRIBED"
  }

  return input.isConfirmed ? "ACTIVE" : "PENDING"
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
    isMissingColumnError(error, "NewsletterCampaign.skipPreviouslySent") ||
    isMissingColumnError(error, "NewsletterAsset.sendAsAttachment")
  )
}

export interface NewsletterDashboardQuery {
  campaignId?: string | null
  subscribersPage?: number | null
  campaignsPage?: number | null
  deliveriesPage?: number | null
  pageSize?: number | null
}

export async function getNewsletterDashboardData(input: NewsletterDashboardQuery = {}): Promise<NewsletterDashboardData> {
  await ensureNewsletterTopics()

  const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_NEWSLETTER_PAGE_SIZE
  const subscribersPage = resolvePage(input.subscribersPage)
  const campaignsPage = resolvePage(input.campaignsPage)
  const deliveriesPage = resolvePage(input.deliveriesPage)

  const topics = getNewsletterTopicDefinitions().map((topic) => ({
    normalizedName: topic.normalizedName,
    name: topic.name,
  }))

  const [
    activeSubscriberCount,
    subscriberOptions,
    subscriberTotal,
  ] = await Promise.all([
    prisma.subscriber.count({
      where: {
        isConfirmed: true,
        unsubscribedAt: null,
      },
    }),
    prisma.subscriber.findMany({
      where: {
        isConfirmed: true,
        unsubscribedAt: null,
      },
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        topics: {
          select: {
            normalizedName: true,
          },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.subscriber.count(),
  ])

  const subscribersPagination = buildPagination(subscriberTotal, subscribersPage, pageSize)
  const subscribers = await prisma.subscriber.findMany({
    orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
    skip: (subscribersPagination.page - 1) * subscribersPagination.pageSize,
    take: subscribersPagination.pageSize,
    select: {
      id: true,
      email: true,
      confirmedAt: true,
      createdAt: true,
      isConfirmed: true,
      unsubscribedAt: true,
      topics: {
        select: {
          normalizedName: true,
        },
        orderBy: { name: "asc" },
      },
    },
  })

  try {
    const campaignTotalPromise = prisma.newsletterCampaign.count()
    const deliveryTotalPromise = prisma.newsletterDelivery.count()

    const [campaignTotal, deliveryTotal] = await Promise.all([campaignTotalPromise, deliveryTotalPromise])
    const campaignsPagination = buildPagination(campaignTotal, campaignsPage, pageSize)
    const deliveriesPagination = buildPagination(deliveryTotal, deliveriesPage, pageSize)

    const [campaigns, deliveries, selectedCampaign] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        orderBy: [{ queueOrder: "asc" }, { createdAt: "desc" }],
        skip: (campaignsPagination.page - 1) * campaignsPagination.pageSize,
        take: campaignsPagination.pageSize,
        select: {
          id: true,
          subject: true,
          markdown: true,
          targetTopics: true,
          recipientMode: true,
          targetSubscriberIds: true,
          skipPreviouslySent: true,
          status: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          queueOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.newsletterDelivery.findMany({
        orderBy: [{ createdAt: "desc" }],
        skip: (deliveriesPagination.page - 1) * deliveriesPagination.pageSize,
        take: deliveriesPagination.pageSize,
        select: {
          id: true,
          campaignId: true,
          email: true,
          status: true,
          errorMessage: true,
          createdAt: true,
          sentAt: true,
        },
      }),
      input.campaignId
        ? prisma.newsletterCampaign.findUnique({
            where: { id: input.campaignId },
            select: {
              id: true,
              subject: true,
              markdown: true,
              targetTopics: true,
              recipientMode: true,
              targetSubscriberIds: true,
              skipPreviouslySent: true,
              status: true,
              queueOrder: true,
              assets: {
                orderBy: [{ createdAt: "asc" }],
                select: {
                  id: true,
                  campaignId: true,
                  kind: true,
                  originalName: true,
                  mime: true,
                  size: true,
                  publicUrl: true,
                  sendAsAttachment: true,
                  createdAt: true,
                },
              },
            },
          })
        : Promise.resolve(null),
    ])

    return {
      topics,
      activeSubscriberCount,
      subscriberOptions: subscriberOptions.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        topics: normalizeNewsletterTopics(subscriber.topics.map((topic) => topic.normalizedName)),
      })),
      subscribers: subscribers.map((subscriber) => {
        const normalizedTopics = normalizeNewsletterTopics(subscriber.topics.map((topic) => topic.normalizedName))
        return {
          id: subscriber.id,
          email: subscriber.email,
          topics: normalizedTopics,
          topicLabels: normalizedTopics.map((topic) => getNewsletterTopicName(topic) ?? topic),
          subscribedAt: (subscriber.confirmedAt ?? subscriber.createdAt).toISOString(),
          status: mapSubscriberStatus({
            isConfirmed: subscriber.isConfirmed,
            unsubscribedAt: subscriber.unsubscribedAt,
          }),
        }
      }),
      subscribersPagination,
      migrationReady: true,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        subject: campaign.subject,
        markdown: campaign.markdown,
        topics: normalizeNewsletterTopics(campaign.targetTopics),
        recipientMode: campaign.recipientMode,
        targetSubscriberIds: campaign.targetSubscriberIds,
        skipPreviouslySent: campaign.skipPreviouslySent,
        status: campaign.status,
        deliveryCount: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        queueOrder: campaign.queueOrder,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      })),
      campaignsPagination,
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        campaignId: delivery.campaignId,
        email: delivery.email,
        status: delivery.status,
        errorMessage: delivery.errorMessage,
        createdAt: delivery.createdAt.toISOString(),
        sentAt: delivery.sentAt?.toISOString() ?? null,
      })),
      deliveriesPagination,
      selectedCampaign: selectedCampaign
        ? {
            id: selectedCampaign.id,
            subject: selectedCampaign.subject,
            markdown: selectedCampaign.markdown ?? "",
            topics: normalizeNewsletterTopics(selectedCampaign.targetTopics),
            recipientMode: selectedCampaign.recipientMode,
            targetSubscriberIds: selectedCampaign.targetSubscriberIds,
            skipPreviouslySent: selectedCampaign.skipPreviouslySent,
            status: selectedCampaign.status,
            queueOrder: selectedCampaign.queueOrder,
            assets: selectedCampaign.assets.map((asset) => ({
              id: asset.id,
              campaignId: asset.campaignId,
              kind: asset.kind,
              originalName: asset.originalName,
              mime: asset.mime,
              size: asset.size,
              publicUrl: asset.publicUrl,
              sendAsAttachment: asset.sendAsAttachment,
              createdAt: asset.createdAt.toISOString(),
            })),
          }
        : null,
    }
  } catch (error) {
    if (!isNewsletterMigrationError(error)) {
      throw error
    }

    return {
      topics,
      activeSubscriberCount,
      subscriberOptions: subscriberOptions.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        topics: normalizeNewsletterTopics(subscriber.topics.map((topic) => topic.normalizedName)),
      })),
      subscribers: subscribers.map((subscriber) => {
        const normalizedTopics = normalizeNewsletterTopics(subscriber.topics.map((topic) => topic.normalizedName))
        return {
          id: subscriber.id,
          email: subscriber.email,
          topics: normalizedTopics,
          topicLabels: normalizedTopics.map((topic) => getNewsletterTopicName(topic) ?? topic),
          subscribedAt: (subscriber.confirmedAt ?? subscriber.createdAt).toISOString(),
          status: mapSubscriberStatus({
            isConfirmed: subscriber.isConfirmed,
            unsubscribedAt: subscriber.unsubscribedAt,
          }),
        }
      }),
      subscribersPagination,
      migrationReady: false,
      campaigns: [],
      campaignsPagination: buildPagination(0, 1, pageSize),
      deliveries: [],
      deliveriesPagination: buildPagination(0, 1, pageSize),
      selectedCampaign: null,
    }
  }
}
