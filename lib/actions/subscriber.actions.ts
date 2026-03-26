"use server"

import { headers } from "next/headers"
import { prisma } from "../db/prisma"
import { z } from "zod"
import { getEmailBaseUrl, isEmailDeliveryConfigured, sendTransactionalEmail } from "../email/provider"
import { buildConfirmSubscriptionEmail } from "../email/templates/confirm-subscription"
import { buildUnsubscribeEmail } from "../email/templates/unsubscribe"
import { normalizeEmail } from "../utils/normalizers"
import { generateToken, hashToken } from "../utils/crypto"
import { slugify } from "../utils/normalizers"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

const SubscribeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email").transform(normalizeEmail),
  _honey: z.string().max(0, "Bot detected"), // Exact empty string required
  topics: z.object({
    all: z.boolean(),
    aiInfosec: z.boolean(),
    projectsLogs: z.boolean()
  }).optional()
})

export async function requestSubscription(payload: { email: string, _honey: string, topics?: any }) {
  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "subscription-request",
      identifier: getClientIp(headerList),
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return { success: false, code: "email_not_configured", error: "Subscription email delivery is not configured." }
    }

    const validated = SubscribeSchema.parse(payload)

    const existing = await prisma.subscriber.findUnique({
      where: { email: validated.email },
    })

    if (existing?.isConfirmed) {
      return { success: false, code: "already_subscribed", error: "Already subscribed." }
    }

    const token = generateToken()
    const hashed = hashToken(token)
    // 24 hour expiration
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

    const topicNames = validated.topics?.all
      ? ["All Seeds"]
      : [
          validated.topics?.aiInfosec ? "AI & InfoSec" : null,
          validated.topics?.projectsLogs ? "Projects & Logs" : null,
        ].filter((topic): topic is string => Boolean(topic))

    const normalizedTopics = topicNames.length > 0 ? topicNames : ["All Seeds"]

    const subscriber = await prisma.$transaction(async (tx) => {
      const topicRecords = await Promise.all(
        normalizedTopics.map((topic) =>
          tx.newsletterTopic.upsert({
            where: { normalizedName: slugify(topic) },
            update: { name: topic },
            create: {
              name: topic,
              normalizedName: slugify(topic),
            },
          }),
        ),
      )

      return tx.subscriber.upsert({
        where: { email: validated.email },
        update: {
          isConfirmed: false,
          confirmedAt: null,
          unsubscribedAt: null,
          confirmTokenHash: hashed,
          confirmTokenExpiresAt: expiresAt,
          topics: {
            set: [],
            connect: topicRecords.map((topic) => ({ id: topic.id })),
          },
        },
        create: {
          email: validated.email,
          confirmTokenHash: hashed,
          confirmTokenExpiresAt: expiresAt,
          topics: {
            connect: topicRecords.map((topic) => ({ id: topic.id })),
          },
        },
      })
    })

    const baseUrl = getEmailBaseUrl()
    const confirmUrl = new URL("/subscribe/confirm", baseUrl)
    confirmUrl.searchParams.set("token", token)

    const unsubscribeUrl = new URL("/unsubscribe", baseUrl)
    unsubscribeUrl.searchParams.set("token", subscriber.unsubscribeToken)

    const emailTemplate = buildConfirmSubscriptionEmail({
      confirmUrl: confirmUrl.toString(),
      unsubscribeUrl: unsubscribeUrl.toString(),
    })

    const emailResult = await sendTransactionalEmail({
      to: validated.email,
      ...emailTemplate,
    })

    if (!emailResult.success) {
      return {
        success: false,
        code: emailResult.error.code === "config_error" ? "email_not_configured" : "request_failed",
        error: emailResult.error.message,
      }
    }

    return {
      success: true,
      code: "verification_sent",
      message:
        emailResult.provider === "test"
          ? "Verification email was generated in the local test outbox."
          : "Verification email sent. Please check your inbox.",
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { success: false, code: "rate_limited", error: error.message }
    }

    console.error("[Subscribe Error]", error)
    return { success: false, code: "request_failed", error: "Failed to request subscription." }
  }
}

export async function confirmSubscription(plaintextToken: string) {
  if (!plaintextToken) return { success: false, code: "invalid", error: "No token provided." }

  const hashed = hashToken(plaintextToken)

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { confirmTokenHash: hashed },
    })

    if (!subscriber) return { success: false, code: "invalid", error: "Invalid verification token." }

    if (subscriber.isConfirmed) {
      return { success: false, code: "already_confirmed", error: "Already confirmed." }
    }

    if (subscriber.confirmTokenExpiresAt && subscriber.confirmTokenExpiresAt < new Date()) {
      return { success: false, code: "expired", error: "Verification token expired. Please re-subscribe." }
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
        // Core Security: Destroy token to prevent reuse / replay
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
        unsubscribedAt: null,
      },
    })

    return { success: true, code: "confirmed", message: "Subscription fully confirmed." }
  } catch (_error) {
    return { success: false, code: "failed", error: "Failed to confirm subscription." }
  }
}

export async function unsubscribeSubscription(plaintextToken: string) {
  if (!plaintextToken) return { success: false, code: "invalid", error: "No token provided." }

  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { unsubscribeToken: plaintextToken },
    })

    if (!subscriber) return { success: false, code: "invalid", error: "Invalid unsubscribe token." }
    if (subscriber.unsubscribedAt) return { success: false, code: "already_unsubscribed", error: "Already unsubscribed." }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        unsubscribedAt: new Date(),
        isConfirmed: false,
      },
    })

    try {
      const baseUrl = getEmailBaseUrl()
      const homeUrl = new URL("/", baseUrl).toString()
      const emailResult = await sendTransactionalEmail({
        to: subscriber.email,
        ...buildUnsubscribeEmail({
          homeUrl,
          resubscribeUrl: homeUrl,
        }),
      })

      if (!emailResult.success) {
        console.error("[Unsubscribe Email Error]", emailResult.error)
        return {
          success: true,
          code: "unsubscribed",
          message: "Subscription cancelled. Confirmation email could not be sent.",
        }
      }
    } catch (error) {
      console.error("[Unsubscribe Email Error]", error)
      return {
        success: true,
        code: "unsubscribed",
        message: "Subscription cancelled. Confirmation email could not be sent.",
      }
    }

    return { success: true, code: "unsubscribed", message: "Subscription cancelled." }
  } catch (_error) {
    return { success: false, code: "failed", error: "Failed to unsubscribe." }
  }
}
