import "server-only"

import { prisma } from "@/lib/db/prisma"
import { getNewsletterTopicDefinitions, normalizeNewsletterTopics, type NewsletterVisibleTopic } from "@/lib/newsletter/topics"

type PrismaLike = typeof prisma

export async function ensureNewsletterTopics(client: PrismaLike = prisma) {
  const definitions = getNewsletterTopicDefinitions()

  return Promise.all(
    definitions.map((topic) =>
      client.newsletterTopic.upsert({
        where: { normalizedName: topic.normalizedName },
        update: { name: topic.name },
        create: {
          name: topic.name,
          normalizedName: topic.normalizedName,
        },
      }),
    ),
  )
}

export function normalizeTopicFilters(topics: string[]): NewsletterVisibleTopic[] {
  return normalizeNewsletterTopics(topics)
}

function buildTopicRecipientWhere(normalizedTopics: NewsletterVisibleTopic[]) {
  const sendToAll = normalizedTopics.includes("all")

  if (sendToAll) {
    return {}
  }

  return {
    OR: [
      {
        topics: {
          some: {
            normalizedName: {
              in: normalizedTopics,
            },
          },
        },
      },
      {
        topics: {
          some: {
            normalizedName: "all",
          },
        },
      },
    ],
  }
}

export async function getEligibleSubscribers(input: {
  topics?: string[]
  recipientMode?: "TOPICS" | "SELECTED_SUBSCRIBERS"
  targetSubscriberIds?: string[]
}) {
  const recipientMode = input.recipientMode ?? "TOPICS"

  if (recipientMode === "SELECTED_SUBSCRIBERS") {
    const targetSubscriberIds = [...new Set((input.targetSubscriberIds ?? []).filter(Boolean))]

    if (targetSubscriberIds.length === 0) {
      return []
    }

    return prisma.subscriber.findMany({
      where: {
        id: {
          in: targetSubscriberIds,
        },
        isConfirmed: true,
        unsubscribedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: { createdAt: "asc" },
    })
  }

  const normalizedTopics = normalizeTopicFilters(input.topics ?? [])

  return prisma.subscriber.findMany({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
      ...buildTopicRecipientWhere(normalizedTopics),
    },
    select: {
      id: true,
      email: true,
    },
    orderBy: { createdAt: "asc" },
  })
}

export async function refreshCampaignAggregates(campaignId: string) {
  const [campaign, grouped] = await Promise.all([
    prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true },
    }),
    prisma.newsletterDelivery.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { status: true },
    }),
  ])

  if (!campaign) {
    return null
  }

  const pending = grouped.find((row) => row.status === "PENDING")?._count.status ?? 0
  const sent = grouped.find((row) => row.status === "SENT")?._count.status ?? 0
  const failed = grouped.find((row) => row.status === "FAILED")?._count.status ?? 0
  const nextStatus =
    pending > 0 ? campaign.status : failed > 0 ? "FAILED" : "COMPLETED"

  return prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      status: nextStatus,
      totalRecipients: pending + sent + failed,
      sentCount: sent,
      failedCount: failed,
      completedAt: pending === 0 ? new Date() : null,
    },
    select: {
      id: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      failedCount: true,
    },
  })
}
