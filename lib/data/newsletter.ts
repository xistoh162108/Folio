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
  const topics = await prisma.newsletterTopic.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      normalizedName: true,
    },
  })

  const activeSubscriberCount = await prisma.subscriber.count({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
    },
  })

  const subscribers = await prisma.subscriber.findMany({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
    },
    orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
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

  try {
    const [campaigns, deliveries] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
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
        orderBy: [{ createdAt: "desc" }],
        take: 50,
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
        email: delivery.email,
        status: delivery.status,
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
