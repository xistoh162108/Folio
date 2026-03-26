"use server"

import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { prisma } from "../db/prisma"
import { z } from "zod"
import { env } from "../env"
import { getEmailBaseUrl, isEmailDeliveryConfigured, sendTransactionalEmail } from "../email/provider"
import { buildContactReceivedEmail } from "../email/templates/contact-received"
import type { ContactSubmitWebhookPayload } from "../contracts/webhooks"
import { kickWorkerRoute } from "../workers/dispatch"
import { normalizeEmail } from "../utils/normalizers"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

const ContactSchema = z.object({
  name: z.string().min(1, "Name required").trim(),
  email: z.string().min(1).email().transform(normalizeEmail),
  message: z.string().min(5, "Message must be detailed"),
  _honey: z.string().max(0, "Bot detected")
})

export async function submitContactMessage(payload: { name: string, email: string, message: string, _honey: string }) {
  try {
    const headerList = await headers()
    assertRateLimit({
      namespace: "contact-submit",
      identifier: getClientIp(headerList),
      limit: 5,
      windowMs: 10 * 60 * 1000,
    })

    if (process.env.NODE_ENV === "production" && !isEmailDeliveryConfigured()) {
      return {
        success: false,
        error: "Contact email delivery is not configured for production.",
      }
    }

    if (process.env.NODE_ENV === "production" && !env.OPS_WEBHOOK_URL) {
      return {
        success: false,
        error: "Ops webhook delivery is not configured for production.",
      }
    }

    const validated = ContactSchema.parse(payload)
    const destination = env.OPS_WEBHOOK_URL ?? "console://ops-webhook"

    await prisma.$transaction(async (tx) => {
      const msg = await tx.contactMessage.create({
        data: {
          name: validated.name,
          email: validated.email,
          message: validated.message,
          status: "PENDING"
        }
      })

      const webhookPayload: ContactSubmitWebhookPayload = {
        contactId: msg.id,
        email: validated.email,
        name: validated.name,
        message: validated.message,
        text: `[PORTAL] New message from ${validated.name} (${validated.email})`,
      }

      await tx.webhookDelivery.create({
        data: {
          eventType: "CONTACT_SUBMIT",
          destination,
          payload: webhookPayload as unknown as Prisma.InputJsonValue,
          status: "PENDING",
        },
      })
    })

    const emailResult = await sendTransactionalEmail({
      to: validated.email,
      ...buildContactReceivedEmail({
        name: validated.name,
        homeUrl: new URL("/", getEmailBaseUrl()).toString(),
      }),
    })

    const dispatched = await kickWorkerRoute("/api/worker/webhook")
    const isConsoleFallback = destination.startsWith("console://")

    if (!emailResult.success) {
      console.error("[Contact Email Error]", emailResult.error)
      return {
        success: true,
        message: dispatched
          ? "Message queued and worker dispatch was triggered, but the receipt email could not be sent."
          : "Message queued, but the receipt email could not be sent.",
      }
    }

    if (isConsoleFallback) {
      return {
        success: true,
        message: dispatched
          ? "Message queued locally. Configure OPS_WEBHOOK_URL to forward it to your ops channel."
          : "Message queued locally. Configure OPS_WEBHOOK_URL and a worker scheduler for external delivery.",
      }
    }

    return {
      success: true,
      message: dispatched ? "Message queued and worker dispatch was triggered." : "Message queued successfully.",
    }
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message }
    }

    console.error("[Contact Sync Error]", err)
    return { success: false, error: "Transmission failed. Please try again." }
  }
}
