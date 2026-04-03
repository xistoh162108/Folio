import { NextResponse } from "next/server"
import { z } from "zod"

import type { AnalyticsEventInput } from "@/lib/contracts/analytics"
import { isMissingColumnError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

const BaseSchema = z.object({
  sessionId: z.string().min(1),
  path: z.string().min(1),
  postId: z.string().min(1).optional(),
  referrer: z.string().optional(),
  userAgentHint: z.string().optional(),
})

const AnalyticsSchema = z.discriminatedUnion("eventType", [
  BaseSchema.extend({
    eventType: z.literal("PAGEVIEW"),
  }),
  BaseSchema.extend({
    eventType: z.literal("HEARTBEAT"),
    duration: z.number().int().nonnegative(),
  }),
  BaseSchema.extend({
    eventType: z.literal("PAGELOAD"),
    pageLoadMs: z.number().int().positive().max(120_000),
  }),
])

const PAGEVIEW_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000

function normalizePath(path: string) {
  if (path.length <= 1) return path
  return path.replace(/\/+$/, "")
}

function isBotUserAgent(userAgent: string) {
  const value = userAgent.toLowerCase()
  return (
    value.includes("bot") ||
    value.includes("spider") ||
    value.includes("crawler") ||
    value.includes("preview") ||
    value.includes("slurp")
  )
}

function getPostPathInfo(path: string) {
  const normalizedPath = normalizePath(path)
  const noteMatch = normalizedPath.match(/^\/notes\/([^/?#]+)/)
  if (noteMatch) {
    return { type: "NOTE" as const, slug: decodeURIComponent(noteMatch[1]) }
  }

  const projectMatch = normalizedPath.match(/^\/projects\/([^/?#]+)/)
  if (projectMatch) {
    return { type: "PROJECT" as const, slug: decodeURIComponent(projectMatch[1]) }
  }

  return null
}

function parseReferrerHost(referrer: string | undefined) {
  if (!referrer) return "Direct"

  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "Direct"
  } catch {
    return "Direct"
  }
}

function parseBrowser(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase()

  if (!ua) return "Unknown"
  if (ua.includes("edg/")) return "Edge"
  if (ua.includes("firefox/")) return "Firefox"
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari"
  if (ua.includes("chrome/")) return "Chrome"

  return "Other"
}

function parseDeviceType(userAgent: string | null) {
  const ua = (userAgent ?? "").toLowerCase()

  if (ua.includes("ipad") || ua.includes("tablet")) return "Tablet"
  if (ua.includes("mobi") || ua.includes("iphone") || ua.includes("android")) return "Mobile"
  if (!ua) return "Unknown"

  return "Desktop"
}

async function parsePayload(request: Request): Promise<AnalyticsEventInput> {
  const text = await request.text()
  const raw = text ? JSON.parse(text) : {}
  return AnalyticsSchema.parse(raw)
}

export async function POST(request: Request) {
  try {
    const payload = await parsePayload(request)
    const normalizedPath = normalizePath(payload.path)
    const userAgent = request.headers.get("user-agent") ?? payload.userAgentHint ?? null
    const ip = getClientIp(request.headers)
    const countryCode =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-country-code")

    if (normalizedPath.startsWith("/admin")) {
      return NextResponse.json({ success: true, skipped: "admin-path" })
    }

    assertRateLimit({
      namespace: "analytics-write",
      identifier: `${ip}:${payload.sessionId}`,
      limit: 120,
      windowMs: 5 * 60 * 1000,
    })

    const isBot = isBotUserAgent(userAgent ?? "")
    const referrerHost = parseReferrerHost(payload.referrer)
    const browser = parseBrowser(userAgent)
    const deviceType = parseDeviceType(userAgent)
    const shouldCountView = payload.eventType === "PAGEVIEW" && !isBot

    await prisma.$transaction(async (tx: any) => {
      const postPath = getPostPathInfo(normalizedPath)
      const resolvedPost =
        payload.postId || postPath
          ? await tx.post.findFirst({
              where: payload.postId
                ? { id: payload.postId }
                : {
                    slug: postPath?.slug,
                    type: postPath?.type,
                  },
              select: {
                id: true,
                status: true,
              },
            })
          : null

      if (shouldCountView) {
        if (resolvedPost?.id && resolvedPost.status === "PUBLISHED") {
          const recentWindow = new Date(Date.now() - PAGEVIEW_DEDUPE_WINDOW_MS)
          const existing = await tx.analytics.findFirst({
            where: {
              sessionId: payload.sessionId,
              eventType: "PAGEVIEW",
              postId: resolvedPost.id,
              createdAt: {
                gte: recentWindow,
              },
            },
          })

          if (!existing) {
            await tx.post.update({
              where: {
                id: resolvedPost.id,
              },
              data: {
                views: {
                  increment: 1,
                },
              },
            })
          }
        }
      }

      await tx.analytics.create({
        data: {
          sessionId: payload.sessionId,
          eventType: payload.eventType,
          path: normalizedPath,
          postId: resolvedPost?.id ?? payload.postId,
          referrer: payload.referrer,
          referrerHost,
          countryCode,
          userAgent,
          browser,
          deviceType,
          isBot,
          duration: payload.duration,
          pageLoadMs: payload.pageLoadMs,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "Invalid analytics payload." }, { status: 400 })
    }

    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 429 })
    }

    if (isMissingColumnError(error)) {
      return NextResponse.json(
        { success: false, error: "Analytics schema is out of date. Apply the latest Prisma migrations." },
        { status: 503 },
      )
    }

    console.error("[analytics]", error)
    return NextResponse.json({ success: false, error: "Analytics write failed." }, { status: 500 })
  }
}
