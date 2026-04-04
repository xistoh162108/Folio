import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isMissingColumnError, isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import {
  buildScopedStoragePath,
  deleteAssetFromSupabase,
  FILE_UPLOAD_POLICY,
  getSupabasePublicUrl,
  IMAGE_UPLOAD_POLICY,
  mapStorageServiceError,
  uploadAssetToSupabase,
} from "@/lib/storage/supabase"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

type UploadKind = "image" | "file"

const FALLBACK_MIME_BY_EXTENSION = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  yml: "text/yaml",
  yaml: "text/yaml",
  xml: "application/xml",
  log: "text/plain",
} as const

function getUploadPolicy(kind: UploadKind) {
  return kind === "image" ? IMAGE_UPLOAD_POLICY : FILE_UPLOAD_POLICY
}

function resolveUploadMime(file: File, allowedMimes: readonly string[]) {
  if (allowedMimes.includes(file.type as never)) {
    return file.type
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  const fallbackMime = FALLBACK_MIME_BY_EXTENSION[extension as keyof typeof FALLBACK_MIME_BY_EXTENSION]
  return fallbackMime && allowedMimes.includes(fallbackMime as never) ? fallbackMime : null
}

function isNewsletterMigrationError(error: unknown) {
  return (
    isMissingTableError(error, "NewsletterAsset") ||
    isMissingColumnError(error, "NewsletterCampaign.markdown") ||
    isMissingColumnError(error, "NewsletterAsset.sendAsAttachment")
  )
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const ip = getClientIp(request.headers)

  try {
    assertRateLimit({
      namespace: "newsletter-upload-user",
      identifier: session.user.id,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    })
    assertRateLimit({
      namespace: "newsletter-upload-ip",
      identifier: ip,
      limit: 60,
      windowMs: 10 * 60 * 1000,
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    throw error
  }

  const formData = await request.formData()
  const kind = formData.get("kind")
  const campaignId = formData.get("campaignId")
  const file = formData.get("file")

  if ((kind !== "image" && kind !== "file") || typeof campaignId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 })
  }

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      status: true,
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: "Target campaign not found." }, { status: 404 })
  }

  if (campaign.status === "SENDING") {
    return NextResponse.json({ error: "Live campaigns cannot accept new assets." }, { status: 400 })
  }

  const policy = getUploadPolicy(kind)
  const resolvedMime = resolveUploadMime(file, policy.allowedMimes)

  if (!resolvedMime) {
    return NextResponse.json({ error: "This MIME type is not allowed." }, { status: 400 })
  }

  if (file.size > policy.maxBytes) {
    return NextResponse.json({ error: "File is too large." }, { status: 400 })
  }

  try {
    const storagePath = buildScopedStoragePath("newsletters", kind, campaignId, file.name)

    await uploadAssetToSupabase({
      bucket: policy.bucket,
      storagePath,
      file,
      contentType: resolvedMime,
    })

    let asset

    try {
      asset = await prisma.newsletterAsset.create({
        data: {
          campaignId,
          kind: kind === "image" ? "IMAGE" : "FILE",
          bucket: policy.bucket,
          storagePath,
          originalName: file.name,
          mime: resolvedMime,
          size: file.size,
          publicUrl: kind === "image" ? getSupabasePublicUrl(policy.bucket, storagePath) : null,
          sendAsAttachment: kind === "file",
        },
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
      })
    } catch (error) {
      await deleteAssetFromSupabase(policy.bucket, storagePath)
      throw error
    }

    return NextResponse.json({
      id: asset.id,
      campaignId: asset.campaignId,
      kind: asset.kind,
      originalName: asset.originalName,
      mime: asset.mime,
      size: asset.size,
      publicUrl: asset.publicUrl,
      sendAsAttachment: asset.sendAsAttachment,
      createdAt: asset.createdAt.toISOString(),
    })
  } catch (error) {
    if (isNewsletterMigrationError(error)) {
      return NextResponse.json({ error: "Newsletter migrations have not been applied yet." }, { status: 503 })
    }

    const message = mapStorageServiceError(error, getUploadPolicy(kind).bucket)
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
