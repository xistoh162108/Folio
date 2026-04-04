"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import type { ProfileEditorInput, ProfileLinkKind } from "@/lib/contracts/profile"
import { prisma } from "@/lib/db/prisma"
import { ensurePrimaryProfileBootstrap } from "@/lib/data/profile"
import { PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"

const ProfileLinkKindSchema = z.enum(["GITHUB", "LINKEDIN", "EMAIL", "WEBSITE", "OTHER"] satisfies [ProfileLinkKind, ...ProfileLinkKind[]])

const ProfileEditorSchema = z.object({
  slug: z.string().trim().min(1).default(PRIMARY_PROFILE_SLUG),
  displayName: z.string().trim().min(1, "Display name is required."),
  role: z.string().trim().min(1, "Role is required."),
  summary: z.string().trim().min(1, "Summary is required."),
  emailAddress: z.string().trim().email("A valid email address is required."),
  resumeHref: z.string().trim().optional().nullable(),
  education: z
    .array(
      z.object({
        institution: z.string().trim().default(""),
        degree: z.string().trim().default(""),
        period: z.string().trim().default(""),
        sortOrder: z.number().int().default(0),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        label: z.string().trim().default(""),
        period: z.string().trim().default(""),
        sortOrder: z.number().int().default(0),
      }),
    )
    .default([]),
  awards: z
    .array(
      z.object({
        title: z.string().trim().default(""),
        issuer: z.string().trim().optional().nullable(),
        detail: z.string().trim().optional().nullable(),
        year: z.string().trim().optional().nullable(),
        sortOrder: z.number().int().default(0),
      }),
    )
    .default([]),
  links: z
    .array(
      z.object({
        label: z.string().trim().default(""),
        url: z.string().trim().default(""),
        kind: ProfileLinkKindSchema.default("OTHER"),
        isVerified: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      }),
    )
    .default([]),
})

type ProfileSaveResult =
  | { success: true }
  | { success: false; error: string }

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function normalizeEducationRows(rows: ProfileEditorInput["education"]) {
  return rows
    .filter((row) => [row.institution, row.degree, row.period].some((value) => value.trim().length > 0))
    .map((row, index) => ({
      institution: row.institution.trim(),
      degree: row.degree.trim(),
      period: row.period.trim(),
      sortOrder: index,
    }))
}

function normalizeExperienceRows(rows: ProfileEditorInput["experience"]) {
  return rows
    .filter((row) => [row.label, row.period].some((value) => value.trim().length > 0))
    .map((row, index) => ({
      title: row.label.trim(),
      label: row.label.trim(),
      detail: "",
      period: row.period.trim(),
      year: null,
      sortOrder: index,
    }))
}

function normalizeAwardRows(rows: ProfileEditorInput["awards"]) {
  return rows
    .filter((row) => [row.title, row.issuer ?? "", row.detail ?? "", row.year ?? ""].some((value) => value.trim().length > 0))
    .map((row, index) => ({
      title: row.title.trim(),
      issuer: normalizeNullableText(row.issuer),
      detail: normalizeNullableText(row.detail),
      year: normalizeNullableText(row.year),
      sortOrder: index,
    }))
}

function normalizeLinkRows(rows: ProfileEditorInput["links"]) {
  return rows
    .filter((row) => row.label.trim().length > 0 || row.url.trim().length > 0)
    .map((row, index) => ({
      label: row.label.trim() || row.url.trim(),
      url: row.url.trim(),
      kind: row.kind,
      isVerified: row.isVerified,
      sortOrder: index,
    }))
    .filter((row) => row.url.length > 0)
}

function firstVerifiedHref(rows: ReturnType<typeof normalizeLinkRows>, kind: ProfileLinkKind) {
  return rows.find((row) => row.kind === kind && row.isVerified)?.url ?? null
}

export async function savePrimaryProfile(input: ProfileEditorInput): Promise<ProfileSaveResult> {
  await requireUser()

  try {
    const validated = ProfileEditorSchema.parse(input)
    await ensurePrimaryProfileBootstrap()

    const education = normalizeEducationRows(validated.education)
    const experience = normalizeExperienceRows(validated.experience)
    const awards = normalizeAwardRows(validated.awards)
    const links = normalizeLinkRows(validated.links)

    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { slug: validated.slug },
        select: { id: true },
      })

      if (!profile) {
        throw new Error("Primary profile not found.")
      }

      await tx.profile.update({
        where: { id: profile.id },
        data: {
          displayName: validated.displayName.trim(),
          role: validated.role.trim(),
          summary: validated.summary.trim(),
          emailAddress: validated.emailAddress.trim(),
          resumeHref: "/resume.pdf",
          githubHref: firstVerifiedHref(links, "GITHUB"),
          linkedinHref: firstVerifiedHref(links, "LINKEDIN"),
          education: {
            deleteMany: {},
            create: education,
          },
          experience: {
            deleteMany: {},
            create: experience,
          },
          awards: {
            deleteMany: {},
            create: awards,
          },
          links: {
            deleteMany: {},
            create: links,
          },
        },
      })
    })

    revalidatePath("/")
    revalidatePath("/admin/settings")
    revalidatePath("/admin/analytics")
    revalidatePath("/contact")
    revalidatePath("/guestbook")
    revalidatePath("/resume.pdf")

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error.issues[0]?.message ?? "Validation failed." : error instanceof Error ? error.message : "Failed to save profile.",
    }
  }
}
