import { PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import type { ProfileResumeEditorState } from "@/lib/contracts/profile"
import {
  deleteAssetFromSupabase,
  downloadAssetFromSupabase,
  FILE_UPLOAD_POLICY,
  storageObjectExists,
  uploadAssetToSupabase,
} from "@/lib/storage/supabase"

export const PROFILE_RESUME_BUCKET = FILE_UPLOAD_POLICY.bucket
export const PROFILE_RESUME_FILE_NAME = "resume.pdf"

export function buildProfileResumeStoragePath(slug = PRIMARY_PROFILE_SLUG) {
  return `profiles/${slug}/${PROFILE_RESUME_FILE_NAME}`
}

async function readResumeOverrideAvailability(slug: string) {
  try {
    return await storageObjectExists(PROFILE_RESUME_BUCKET, buildProfileResumeStoragePath(slug))
  } catch {
    // Read-only profile surfaces should fail open to the generated resume when override storage is unavailable.
    return false
  }
}

export async function getProfileResumeEditorState(slug = PRIMARY_PROFILE_SLUG): Promise<ProfileResumeEditorState> {
  const hasUploadedResume = await readResumeOverrideAvailability(slug)

  return {
    source: hasUploadedResume ? "uploaded" : "generated",
    fileName: hasUploadedResume ? PROFILE_RESUME_FILE_NAME : null,
  }
}

export async function uploadProfileResumeOverride(slug: string, file: File) {
  const storagePath = buildProfileResumeStoragePath(slug)

  await uploadAssetToSupabase({
    bucket: PROFILE_RESUME_BUCKET,
    storagePath,
    file,
    contentType: "application/pdf",
    upsert: true,
  })

  return {
    source: "uploaded" as const,
    fileName: PROFILE_RESUME_FILE_NAME,
  }
}

export async function removeProfileResumeOverride(slug: string) {
  await deleteAssetFromSupabase(PROFILE_RESUME_BUCKET, buildProfileResumeStoragePath(slug))

  return {
    source: "generated" as const,
    fileName: null,
  }
}

export async function readProfileResumeOverride(slug = PRIMARY_PROFILE_SLUG) {
  try {
    return await downloadAssetFromSupabase(PROFILE_RESUME_BUCKET, buildProfileResumeStoragePath(slug))
  } catch {
    // Public resume reads must fall back to generated output instead of failing the route.
    return null
  }
}
