import "server-only"

import { prisma } from "@/lib/db/prisma"
import { slugify } from "@/lib/utils/normalizers"

export function normalizeTopicFilters(topics: string[]) {
  const normalized = [...new Set(topics.map((topic) => slugify(topic)).filter(Boolean))]
  return normalized.length > 0 ? normalized : ["all-seeds"]
}

export async function getEligibleSubscribers(topics: string[]) {
  const normalizedTopics = normalizeTopicFilters(topics)
  const sendToAll = normalizedTopics.includes("all-seeds")

  return prisma.subscriber.findMany({
    where: {
      isConfirmed: true,
      unsubscribedAt: null,
      ...(sendToAll
        ? {}
        : {
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
                    normalizedName: "all-seeds",
                  },
                },
              },
            ],
          }),
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
