import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isMissingTableError } from "@/lib/db/errors"
import { prisma } from "@/lib/db/prisma"
import {
  buildStoragePath,
  deleteAssetFromSupabase,
  FILE_UPLOAD_POLICY,
  getSupabasePublicUrl,
  IMAGE_UPLOAD_POLICY,
  mapStorageServiceError,
  uploadAssetToSupabase,
} from "@/lib/storage/supabase"
import type { UploadKind, UploadResponse } from "@/lib/contracts/uploads"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"

function getUploadPolicy(kind: UploadKind) {
  return kind === "image" ? IMAGE_UPLOAD_POLICY : FILE_UPLOAD_POLICY
}

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

function resolveUploadMime(file: File, allowedMimes: readonly string[]) {
  if (allowedMimes.includes(file.type as never)) {
    return file.type
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  const fallbackMime = FALLBACK_MIME_BY_EXTENSION[extension as keyof typeof FALLBACK_MIME_BY_EXTENSION]

  return fallbackMime && allowedMimes.includes(fallbackMime as never) ? fallbackMime : null
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const ip = getClientIp(request.headers)

  try {
    assertRateLimit({
      namespace: "admin-upload-user",
      identifier: session.user.id,
      limit: 30,
      windowMs: 10 * 60 * 1000,
    })
    assertRateLimit({
      namespace: "admin-upload-ip",
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
  const postId = formData.get("postId")
  const file = formData.get("file")

  if ((kind !== "image" && kind !== "file") || typeof postId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Target post not found." }, { status: 404 })
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
    try {
      await prisma.postAsset.findFirst({
        select: { id: true },
      })
    } catch (error) {
      if (isMissingTableError(error, "PostAsset")) {
        return NextResponse.json(
          { error: "PostAsset migration has not been applied yet. Run the latest Prisma migrations first." },
          { status: 503 },
        )
      }

      throw error
    }

    const storagePath = buildStoragePath(kind, postId, file.name)

    await uploadAssetToSupabase({
      bucket: policy.bucket,
      storagePath,
      file,
      contentType: resolvedMime,
    })

    let asset

    try {
      asset = await prisma.postAsset.create({
        data: {
          postId,
          kind: kind === "image" ? "IMAGE" : "FILE",
          bucket: policy.bucket,
          storagePath,
          originalName: file.name,
          mime: resolvedMime,
          size: file.size,
          publicUrl: kind === "image" ? getSupabasePublicUrl(policy.bucket, storagePath) : null,
        },
      })
    } catch (error) {
      try {
        await deleteAssetFromSupabase(policy.bucket, storagePath)
      } catch (cleanupError) {
        console.error("[uploads] failed to clean up orphaned storage object", cleanupError)
      }

      throw error
    }

    const payload: UploadResponse = {
      assetId: asset.id,
      kind,
      storagePath: asset.storagePath,
      originalName: asset.originalName,
      mime: asset.mime,
      size: asset.size,
      url:
        kind === "image"
          ? asset.publicUrl ?? undefined
          : `/api/files/${asset.id}`,
    }

    return NextResponse.json(payload)
  } catch (error) {
    const message = mapStorageServiceError(error, policy.bucket)

    return NextResponse.json({ error: message }, { status: 503 })
  }
}
