import "server-only"

import type { CampaignSummaryDTO, DeliveryRowDTO, NewsletterSubscriberRowDTO } from "@/lib/contracts/newsletter"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"

export interface NewsletterDashboardData {
  topics: { id: string; name: string; normalizedName: string }[]
  activeSubscriberCount: number
  subscribers: NewsletterSubscriberRowDTO[]
  campaigns: CampaignSummaryDTO[]
  deliveries: DeliveryRowDTO[]
  migrationReady: boolean
}

export async function getNewsletterDashboardData(): Promise<NewsletterDashboardData> {
  const topicsPromise = prisma.newsletterTopic.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      normalizedName: true,
    },
  })

  const activeSubscriberCountPromise = prisma.subscriber.count({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
    },
  })

  const subscribersPromise = prisma.subscriber.findMany({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
    },
    orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
    take: 250,
    select: {
      id: true,
      email: true,
      confirmedAt: true,
      createdAt: true,
      topics: {
        select: {
          name: true,
        },
        orderBy: { name: "asc" },
      },
    },
  })

  const [topics, activeSubscriberCount, subscribers] = await Promise.all([
    topicsPromise,
    activeSubscriberCountPromise,
    subscribersPromise,
  ])

  try {
    const [campaigns, deliveries] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 250,
        select: {
          id: true,
          subject: true,
          targetTopics: true,
          status: true,
          totalRecipients: true,
          sentCount: true,
          failedCount: true,
          createdAt: true,
        },
      }),
      prisma.newsletterDelivery.findMany({
        orderBy: [{ queueOrder: "asc" }, { createdAt: "desc" }],
        take: 500,
        select: {
          id: true,
          campaignId: true,
          subscriberId: true,
          email: true,
          status: true,
          queueOrder: true,
          errorMessage: true,
          createdAt: true,
          sentAt: true,
        },
      }),
    ])

    return {
      topics,
      activeSubscriberCount,
      subscribers: subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        topics: subscriber.topics.map((topic) => topic.name),
        subscribedAt: (subscriber.confirmedAt ?? subscriber.createdAt).toISOString(),
      })),
      migrationReady: true,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        subject: campaign.subject,
        topics: campaign.targetTopics,
        status: campaign.status,
        deliveryCount: campaign.totalRecipients,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        createdAt: campaign.createdAt.toISOString(),
      })),
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        campaignId: delivery.campaignId,
        subscriberId: delivery.subscriberId,
        email: delivery.email,
        status: delivery.status,
        queueOrder: delivery.queueOrder,
        errorMessage: delivery.errorMessage,
        createdAt: delivery.createdAt.toISOString(),
        sentAt: delivery.sentAt?.toISOString() ?? null,
      })),
    }
  } catch (error) {
    if (!isMissingTableError(error, "NewsletterCampaign") && !isMissingTableError(error, "NewsletterDelivery")) {
      throw error
    }

    return {
      topics,
      activeSubscriberCount,
      subscribers: subscribers.map((subscriber) => ({
        id: subscriber.id,
        email: subscriber.email,
        topics: subscriber.topics.map((topic) => topic.name),
        subscribedAt: (subscriber.confirmedAt ?? subscriber.createdAt).toISOString(),
      })),
      migrationReady: false,
      campaigns: [],
      deliveries: [],
    }
  }
}
