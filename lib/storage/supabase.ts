import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"

import { createClient } from "@supabase/supabase-js"

import { env } from "@/lib/env"
import {
  deleteTestStorageObject,
  readTestStorageObject,
  resolveTestStoragePath,
  writeTestStorageObject,
} from "@/lib/testing/sinks"
import { slugify } from "@/lib/utils/normalizers"

export const IMAGE_UPLOAD_POLICY = {
  bucket: "post-media",
  allowedMimes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 8 * 1024 * 1024,
} as const

export const FILE_UPLOAD_POLICY = {
  bucket: "post-files",
  allowedMimes: [
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/yaml",
    "application/xml",
    "text/xml",
  ],
  maxBytes: 20 * 1024 * 1024,
} as const

export const STORAGE_BUCKET_RULES = [
  {
    bucket: IMAGE_UPLOAD_POLICY.bucket,
    label: "post-media bucket",
    public: true,
    allowedMimes: [...IMAGE_UPLOAD_POLICY.allowedMimes],
    maxBytes: IMAGE_UPLOAD_POLICY.maxBytes,
  },
  {
    bucket: FILE_UPLOAD_POLICY.bucket,
    label: "post-files bucket",
    public: false,
    allowedMimes: [...FILE_UPLOAD_POLICY.allowedMimes],
    maxBytes: FILE_UPLOAD_POLICY.maxBytes,
  },
] as const

export interface StorageBucketSnapshot {
  bucket: string
  label: string
  exists: boolean
  visibility: "public" | "private" | "unknown"
  expectedVisibility: "public" | "private"
  detail: string
}

export interface StorageBootstrapSnapshot {
  driver: "supabase" | "test" | "unconfigured"
  configured: boolean
  buckets: StorageBucketSnapshot[]
}

type StorageBucketRule = (typeof STORAGE_BUCKET_RULES)[number]

type SupabaseBucketRecord = {
  id?: unknown
  name?: unknown
  public?: unknown
}

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
  return env.APP_URL || env.NEXTAUTH_URL || "http://127.0.0.1:3000"
}

function isForbiddenTestStorageDriver() {
  return env.STORAGE_DRIVER === "test" && process.env.NODE_ENV === "production"
}

function usingTestStorageDriver() {
  return env.STORAGE_DRIVER === "test" && !isForbiddenTestStorageDriver()
}

export function isTestStorageDriverActive() {
  return usingTestStorageDriver()
}

function buildTestStorageUrl(bucket: string, storagePath: string) {
  const url = new URL("/api/test-storage", getStorageBaseUrl())
  url.searchParams.set("bucket", bucket)
  url.searchParams.set("path", storagePath)
  return url.toString()
}

function requireSupabaseAdminClient() {
  if (isForbiddenTestStorageDriver()) {
    throw new Error("Test storage driver is not allowed in production.")
  }

  if (usingTestStorageDriver()) {
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

function asExpectedVisibility(isPublic: boolean): "public" | "private" {
  return isPublic ? "public" : "private"
}

function normalizeStorageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }

  return "Storage request failed."
}

function isMissingBucketMessage(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes("bucket") && normalized.includes("not found")
}

function isMissingObjectMessage(message: string) {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("not found") ||
    normalized.includes("no such file") ||
    normalized.includes("does not exist") ||
    normalized.includes("object not found")
  )
}

function createBucketSnapshot(input: {
  bucket: string
  label: string
  exists: boolean
  visibility: "public" | "private" | "unknown"
  expectedVisibility: "public" | "private"
  detail: string
}): StorageBucketSnapshot {
  return {
    bucket: input.bucket,
    label: input.label,
    exists: input.exists,
    visibility: input.visibility,
    expectedVisibility: input.expectedVisibility,
    detail: input.detail,
  }
}

async function listConfiguredBuckets() {
  const client = requireSupabaseAdminClient()
  const { data, error } = await client.storage.listBuckets()

  if (error) {
    throw new Error(error.message)
  }

  return (Array.isArray(data) ? data : []) as SupabaseBucketRecord[]
}

function findBucketRecord(records: SupabaseBucketRecord[], bucket: string) {
  return (
    records.find((record) => {
      const id = typeof record.id === "string" ? record.id : null
      const name = typeof record.name === "string" ? record.name : null
      return id === bucket || name === bucket
    }) ?? null
  )
}

function toBucketSnapshot(rule: StorageBucketRule, record: SupabaseBucketRecord | null): StorageBucketSnapshot {
  const expectedVisibility = asExpectedVisibility(rule.public)

  if (!record) {
    return createBucketSnapshot({
      bucket: rule.bucket,
      label: rule.label,
      exists: false,
      visibility: "unknown",
      expectedVisibility,
      detail: `Bucket ${rule.bucket} is missing; expected ${expectedVisibility} visibility.`,
    })
  }

  const visibility = Boolean(record.public) ? "public" : "private"

  return createBucketSnapshot({
    bucket: rule.bucket,
    label: rule.label,
    exists: true,
    visibility,
    expectedVisibility,
    detail:
      visibility === expectedVisibility
        ? `${rule.bucket} is ${visibility}.`
        : `${rule.bucket} is ${visibility}; expected ${expectedVisibility}.`,
  })
}

export function mapStorageServiceError(error: unknown, bucket?: string) {
  const message = normalizeStorageErrorMessage(error)

  if (isMissingBucketMessage(message)) {
    if (bucket) {
      return `Storage bucket '${bucket}' is missing. Run pnpm storage:bootstrap and verify bucket visibility in /admin/analytics.`
    }

    return "A required storage bucket is missing. Run pnpm storage:bootstrap and verify bucket visibility in /admin/analytics."
  }

  if (message === "Supabase storage is not configured.") {
    return "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or use STORAGE_DRIVER=test."
  }

  if (message === "Test storage driver is not allowed in production.") {
    return "STORAGE_DRIVER=test is not allowed in production. Switch to Supabase storage before deploy."
  }

  return message
}

export async function inspectStorageBootstrapState(): Promise<StorageBootstrapSnapshot> {
  if (isForbiddenTestStorageDriver()) {
    return {
      driver: "test",
      configured: false,
      buckets: STORAGE_BUCKET_RULES.map((rule) =>
        createBucketSnapshot({
          bucket: rule.bucket,
          label: rule.label,
          exists: false,
          visibility: "unknown",
          expectedVisibility: asExpectedVisibility(rule.public),
          detail: "Test storage driver is configured but forbidden in production.",
        }),
      ),
    }
  }

  if (usingTestStorageDriver()) {
    return {
      driver: "test",
      configured: true,
      buckets: STORAGE_BUCKET_RULES.map((rule) =>
        createBucketSnapshot({
          bucket: rule.bucket,
          label: rule.label,
          exists: true,
          visibility: asExpectedVisibility(rule.public),
          expectedVisibility: asExpectedVisibility(rule.public),
          detail: `${rule.bucket} is ${asExpectedVisibility(rule.public)}.`,
        }),
      ),
    }
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      driver: "unconfigured",
      configured: false,
      buckets: STORAGE_BUCKET_RULES.map((rule) =>
        createBucketSnapshot({
          bucket: rule.bucket,
          label: rule.label,
          exists: false,
          visibility: "unknown",
          expectedVisibility: asExpectedVisibility(rule.public),
          detail: "Supabase credentials are missing, so bucket state cannot be verified.",
        }),
      ),
    }
  }

  const records = await listConfiguredBuckets()

  return {
    driver: "supabase",
    configured: true,
    buckets: STORAGE_BUCKET_RULES.map((rule) => toBucketSnapshot(rule, findBucketRecord(records, rule.bucket))),
  }
}

export async function bootstrapStorageBuckets(): Promise<StorageBootstrapSnapshot> {
  if (isForbiddenTestStorageDriver()) {
    throw new Error("Test storage driver is not allowed in production.")
  }

  if (usingTestStorageDriver()) {
    return inspectStorageBootstrapState()
  }

  const client = requireSupabaseAdminClient()
  const existing = await listConfiguredBuckets()

  for (const rule of STORAGE_BUCKET_RULES) {
    const record = findBucketRecord(existing, rule.bucket)
    const bucketOptions = {
      public: rule.public,
      allowedMimeTypes: [...rule.allowedMimes],
      fileSizeLimit: rule.maxBytes,
    }

    if (!record) {
      const { error } = await client.storage.createBucket(rule.bucket, bucketOptions)

      if (error) {
        throw new Error(error.message)
      }

      continue
    }

    const { error } = await client.storage.updateBucket(rule.bucket, bucketOptions)

    if (error) {
      throw new Error(error.message)
    }
  }

  return inspectStorageBootstrapState()
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

export function buildScopedStoragePath(scope: string, kind: "image" | "file", entityId: string, originalName: string) {
  const { safeBase, extension } = sanitizeOriginalName(originalName)
  const suffix = randomUUID()
  const filename = extension ? `${suffix}-${safeBase}.${extension}` : `${suffix}-${safeBase}`
  return `${scope}/${entityId}/${kind === "image" ? "images" : "files"}/${filename}`
}

export function buildStoragePath(kind: "image" | "file", postId: string, originalName: string) {
  return buildScopedStoragePath("posts", kind, postId, originalName)
}

export async function uploadAssetToSupabase(input: {
  bucket: string
  storagePath: string
  file: File
  contentType: string
  upsert?: boolean
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
    upsert: input.upsert ?? false,
  })

  if (error) {
    throw new Error(mapStorageServiceError(error, input.bucket))
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

    throw new Error(mapStorageServiceError(error, bucket))
  }
}

export async function storageObjectExists(bucket: string, storagePath: string) {
  if (usingTestStorageDriver()) {
    try {
      await fs.access(resolveTestStoragePath(bucket, storagePath))
      return true
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false
      }

      throw error
    }
  }

  const client = requireSupabaseAdminClient()
  const directory = path.posix.dirname(storagePath)
  const fileName = path.posix.basename(storagePath)
  const { data, error } = await client.storage.from(bucket).list(directory === "." ? undefined : directory, {
    search: fileName,
  })

  if (error) {
    throw new Error(mapStorageServiceError(error, bucket))
  }

  return (Array.isArray(data) ? data : []).some((entry) => entry.name === fileName)
}

export async function downloadAssetFromSupabase(bucket: string, storagePath: string) {
  if (usingTestStorageDriver()) {
    try {
      const buffer = await readTestStorageObject(bucket, storagePath)
      return {
        buffer,
        contentType: null,
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null
      }

      throw error
    }
  }

  const client = requireSupabaseAdminClient()
  const { data, error } = await client.storage.from(bucket).download(storagePath)

  if (error) {
    if (isMissingObjectMessage(error.message ?? "")) {
      return null
    }

    throw new Error(mapStorageServiceError(error, bucket))
  }

  if (!data) {
    return null
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || null,
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
    throw new Error(mapStorageServiceError(error?.message ?? "Failed to create a signed download URL.", bucket))
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
