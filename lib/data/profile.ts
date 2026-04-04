import "server-only"

import { prisma } from "@/lib/db/prisma"
import { isMissingTableError, isUniqueConstraintError } from "@/lib/db/errors"
import { buildStaticProfileBootstrap, buildStaticProfileSnapshot, PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import { getProfileResumeEditorState } from "@/lib/profile/resume"
import type { ProfileEditorInput, ProfileLinkDTO, ProfileLinkKind, ProfileResumeEditorState, ProfileSnapshotDTO } from "@/lib/contracts/profile"

function mapProfileSnapshot(profile: {
  id: string
  slug: string
  displayName: string
  role: string
  summary: string
  emailAddress: string
  resumeHref: string | null
  githubHref: string | null
  linkedinHref: string | null
  education: Array<{
    id: string
    institution: string
    degree: string
    period: string
    sortOrder: number
  }>
  experience: Array<{
    id: string
    label: string
    period: string
    sortOrder: number
  }>
  awards: Array<{
    id: string
    title: string
    issuer: string | null
    detail: string | null
    year: string | null
    sortOrder: number
  }>
  links: Array<{
    id: string
    label: string
    url: string
    kind: "GITHUB" | "LINKEDIN" | "EMAIL" | "WEBSITE" | "OTHER"
    isVerified: boolean
    sortOrder: number
  }>
}): ProfileSnapshotDTO {
  return {
    ...profile,
    source: "database",
  }
}

export function mapProfileEditorInput(
  snapshot: ProfileSnapshotDTO,
  resumeState: ProfileResumeEditorState = { source: "generated", fileName: null },
): ProfileEditorInput {
  return {
    slug: snapshot.slug,
    displayName: snapshot.displayName,
    role: snapshot.role,
    summary: snapshot.summary,
    emailAddress: snapshot.emailAddress,
    resumeHref: snapshot.resumeHref,
    resumeState,
    education: snapshot.education.map((entry) => ({
      id: entry.id,
      institution: entry.institution,
      degree: entry.degree,
      period: entry.period,
      sortOrder: entry.sortOrder,
    })),
    experience: snapshot.experience.map((entry) => ({
      id: entry.id,
      label: entry.label,
      period: entry.period,
      sortOrder: entry.sortOrder,
    })),
    awards: snapshot.awards.map((entry) => ({
      id: entry.id,
      title: entry.title,
      issuer: entry.issuer,
      detail: entry.detail,
      year: entry.year,
      sortOrder: entry.sortOrder,
    })),
    links: snapshot.links.map((entry) => ({
      id: entry.id,
      label: entry.label,
      url: entry.url,
      kind: entry.kind,
      isVerified: entry.isVerified,
      sortOrder: entry.sortOrder,
    })),
  }
}

export function getVerifiedProfileLink(snapshot: ProfileSnapshotDTO, kind: ProfileLinkKind): ProfileLinkDTO | null {
  return snapshot.links.find((link) => link.kind === kind && link.isVerified) ?? null
}

async function findPrimaryProfileRecord() {
  return prisma.profile.findUnique({
    where: { slug: PRIMARY_PROFILE_SLUG },
    include: {
      education: { orderBy: { sortOrder: "asc" } },
      experience: { orderBy: { sortOrder: "asc" } },
      awards: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
    },
  })
}

export async function getPrimaryProfileSnapshot(): Promise<ProfileSnapshotDTO> {
  try {
    const snapshot = await findPrimaryProfileRecord()

    return snapshot ? mapProfileSnapshot(snapshot) : buildStaticProfileSnapshot()
  } catch (error) {
    if (isMissingTableError(error, "Profile")) {
      return buildStaticProfileSnapshot()
    }

    throw error
  }
}

export async function getPrimaryProfileRuntimeSnapshot(): Promise<ProfileSnapshotDTO> {
  return getPrimaryProfileSettingsSnapshot()
}

export async function getPrimaryProfileSettingsSnapshot(): Promise<ProfileSnapshotDTO> {
  const snapshot = await getPrimaryProfileSnapshot()

  if (snapshot.source === "database") {
    return snapshot
  }

  return ensurePrimaryProfileBootstrap()
}

export async function ensurePrimaryProfileBootstrap(): Promise<ProfileSnapshotDTO> {
  try {
    const existing = await findPrimaryProfileRecord()
    if (existing) {
      return mapProfileSnapshot(existing)
    }

    const bootstrap = buildStaticProfileBootstrap()
    try {
      const snapshot = await prisma.profile.create({
        data: {
          slug: bootstrap.slug,
          displayName: bootstrap.displayName,
          role: bootstrap.role,
          summary: bootstrap.summary,
          emailAddress: bootstrap.emailAddress,
          resumeHref: bootstrap.resumeHref,
          githubHref: bootstrap.githubHref,
          linkedinHref: bootstrap.linkedinHref,
          education: {
            create: bootstrap.education,
          },
          experience: {
            create: bootstrap.experience,
          },
          awards: {
            create: bootstrap.awards,
          },
          links: {
            create: bootstrap.links,
          },
        },
        include: {
          education: { orderBy: { sortOrder: "asc" } },
          experience: { orderBy: { sortOrder: "asc" } },
          awards: { orderBy: { sortOrder: "asc" } },
          links: { orderBy: { sortOrder: "asc" } },
        },
      })

      return mapProfileSnapshot(snapshot)
    } catch (error) {
      if (isUniqueConstraintError(error, "slug")) {
        const snapshot = await findPrimaryProfileRecord()
        if (snapshot) {
          return mapProfileSnapshot(snapshot)
        }
      }

      throw error
    }
  } catch (error) {
    if (isMissingTableError(error, "Profile")) {
      return buildStaticProfileSnapshot()
    }

    throw error
  }
}

export async function getPrimaryProfileEditorState(): Promise<ProfileEditorInput> {
  const snapshot = await ensurePrimaryProfileBootstrap()
  const resumeState = await getProfileResumeEditorState(snapshot.slug)
  return mapProfileEditorInput(snapshot, resumeState)
}

export async function getPrimaryProfileSettingsEditorState() {
  const snapshot = await getPrimaryProfileSettingsSnapshot()
  const resumeState = await getProfileResumeEditorState(snapshot.slug)

  return {
    source: snapshot.source,
    profile: mapProfileEditorInput(snapshot, resumeState),
  }
}
