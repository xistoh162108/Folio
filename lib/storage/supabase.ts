import { randomUUID } from "crypto"
import path from "path"

import { createClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import {
  deleteTestStorageObject,
  readTestStorageObject,
  resolveTestStoragePath,
  writeTestStorageObject,
} from "@/lib/testing/sinks"
import { getCanonicalAppUrl } from "@/lib/runtime/origin"
import { slugify } from "@/lib/utils/normalizers"

export const IMAGE_UPLOAD_POLICY = {
  bucket: "post-media",
  allowedMimes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 8 * 1024 * 1024,
} as const

export const FILE_UPLOAD_POLICY = {
  bucket: "post-files",
  allowedMimes: ["application/pdf", "text/plain"],
  maxBytes: 20 * 1024 * 1024,
} as const

const DANGEROUS_EXTENSIONS = new Set([
  "exe",
  "sh",
  "bat",
  "cmd",
  "ps1",
  "msi",
  "com",
  "scr",
  "jar",
  "js",
  "mjs",
  "cjs",
  "php",
  "py",
  "rb",
])

let supabaseAdmin:
  | ReturnType<typeof createClient>
  | undefined

function getStorageBaseUrl() {
  return getCanonicalAppUrl()
}

function usingTestStorageDriver() {
  return env.STORAGE_DRIVER === "test"
}

function buildTestStorageUrl(bucket: string, storagePath: string) {
  const url = new URL("/api/test-storage", getStorageBaseUrl())
  url.searchParams.set("bucket", bucket)
  url.searchParams.set("path", storagePath)
  return url.toString()
}

function requireSupabaseAdminClient() {
  if (usingTestStorageDriver()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test storage driver is not allowed in production.")
    }

    throw new Error("Supabase client requested while test storage driver is active.")
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase storage is not configured.")
  }

  supabaseAdmin ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabaseAdmin
}

export function sanitizeOriginalName(originalName: string) {
  const parsed = path.parse(originalName || "upload")
  const extension = parsed.ext.replace(/^\./, "").toLowerCase()

  if (extension.includes(".")) {
    throw new Error("Double extensions are not allowed.")
  }

  if (extension && DANGEROUS_EXTENSIONS.has(extension)) {
    throw new Error("This file extension is not allowed.")
  }

  const safeBase = slugify(parsed.name) || "file"
  return {
    safeBase,
    extension,
  }
}

export function buildStoragePath(kind: "image" | "file", postId: string, originalName: string) {
  const { safeBase, extension } = sanitizeOriginalName(originalName)
  const suffix = randomUUID()
  const filename = extension ? `${suffix}-${safeBase}.${extension}` : `${suffix}-${safeBase}`
  return `posts/${postId}/${kind === "image" ? "images" : "files"}/${filename}`
}

export async function uploadAssetToSupabase(input: {
  bucket: string
  storagePath: string
  file: File
  contentType: string
}) {
  if (usingTestStorageDriver()) {
    const buffer = Buffer.from(await input.file.arrayBuffer())
    await writeTestStorageObject(input.bucket, input.storagePath, buffer)
    return
  }

  const client = requireSupabaseAdminClient()
  const buffer = Buffer.from(await input.file.arrayBuffer())

  const { error } = await client.storage.from(input.bucket).upload(input.storagePath, buffer, {
    contentType: input.contentType,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteAssetFromSupabase(bucket: string, storagePath: string) {
  if (usingTestStorageDriver()) {
    await deleteTestStorageObject(bucket, storagePath)
    return
  }

  const client = requireSupabaseAdminClient()
  const { error } = await client.storage.from(bucket).remove([storagePath])

  if (error) {
    const message = String(error.message ?? "").toLowerCase()

    if (message.includes("not found") || message.includes("no such file") || message.includes("does not exist")) {
      return
    }

    throw new Error(error.message)
  }
}

export function getSupabasePublicUrl(bucket: string, storagePath: string) {
  if (usingTestStorageDriver()) {
    return buildTestStorageUrl(bucket, storagePath)
  }

  const client = requireSupabaseAdminClient()
  const { data } = client.storage.from(bucket).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function createSignedDownloadUrl(bucket: string, storagePath: string, expiresInSeconds = 600) {
  if (usingTestStorageDriver()) {
    return buildTestStorageUrl(bucket, storagePath)
  }

  const client = requireSupabaseAdminClient()
  const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to create a signed download URL.")
  }

  return data.signedUrl
}

export async function readTestStorageAsset(bucket: string, storagePath: string) {
  if (!usingTestStorageDriver()) {
    throw new Error("Test storage driver is not active.")
  }

  resolveTestStoragePath(bucket, storagePath)
  return readTestStorageObject(bucket, storagePath)
}
