import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/auth"
import { PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import { mapStorageServiceError } from "@/lib/storage/supabase"
import { assertRateLimit, getClientIp, RateLimitExceededError } from "@/lib/security/rate-limit"
import { removeProfileResumeOverride, uploadProfileResumeOverride } from "@/lib/profile/resume"

const RESUME_ALLOWED_MIMES = ["application/pdf"] as const
const RESUME_MAX_BYTES = 20 * 1024 * 1024

const FALLBACK_PDF_MIMES = {
  pdf: "application/pdf",
} as const

function resolveResumeMime(file: File) {
  if (RESUME_ALLOWED_MIMES.includes(file.type as (typeof RESUME_ALLOWED_MIMES)[number])) {
    return file.type
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  return FALLBACK_PDF_MIMES[extension as keyof typeof FALLBACK_PDF_MIMES] ?? null
}

async function requireAdminRequest(request: Request) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) }
  }

  const ip = getClientIp(request.headers)

  try {
    assertRateLimit({
      namespace: "admin-profile-resume-user",
      identifier: session.user.id,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    })
    assertRateLimit({
      namespace: "admin-profile-resume-ip",
      identifier: ip,
      limit: 40,
      windowMs: 10 * 60 * 1000,
    })
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { error: NextResponse.json({ error: error.message }, { status: 429 }) }
    }

    throw error
  }

  return { userId: session.user.id }
}

function revalidateProfileResumePaths() {
  revalidatePath("/admin/settings")
  revalidatePath("/admin/analytics")
  revalidatePath("/resume.pdf")
}

export async function POST(request: Request) {
  const auth = await requireAdminRequest(request)
  if ("error" in auth) {
    return auth.error
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 })
  }

  const resolvedMime = resolveResumeMime(file)
  if (!resolvedMime) {
    return NextResponse.json({ error: "Only PDF resumes are allowed." }, { status: 400 })
  }

  if (file.size > RESUME_MAX_BYTES) {
    return NextResponse.json({ error: "Resume PDF is too large." }, { status: 400 })
  }

  try {
    const resumeState = await uploadProfileResumeOverride(PRIMARY_PROFILE_SLUG, file)
    revalidateProfileResumePaths()
    return NextResponse.json({ resumeState })
  } catch (error) {
    return NextResponse.json({ error: mapStorageServiceError(error) }, { status: 503 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminRequest(request)
  if ("error" in auth) {
    return auth.error
  }

  try {
    const resumeState = await removeProfileResumeOverride(PRIMARY_PROFILE_SLUG)
    revalidateProfileResumePaths()
    return NextResponse.json({ resumeState })
  } catch (error) {
    return NextResponse.json({ error: mapStorageServiceError(error) }, { status: 503 })
  }
}
