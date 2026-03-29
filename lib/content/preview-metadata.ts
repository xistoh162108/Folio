import { z } from "zod"

import type { PreviewMetadata } from "@/lib/contracts/posts"

const GenericPreviewMetadataSchema = z.object({
  kind: z.literal("GENERIC"),
})

const YouTubePreviewMetadataSchema = z.object({
  kind: z.literal("YOUTUBE"),
  videoId: z.string().min(1),
})

const GitHubPreviewMetadataSchema = z.object({
  kind: z.literal("GITHUB"),
  subtype: z.literal("REPO").optional(),
  owner: z.string(),
  repo: z.string(),
  stars: z.number().int().nullable(),
  forks: z.number().int().nullable(),
  primaryLanguage: z.string().nullable(),
  openIssues: z.number().int().nullable(),
})

const GitHubIssuePreviewMetadataSchema = z.object({
  kind: z.literal("GITHUB"),
  subtype: z.literal("ISSUE"),
  owner: z.string(),
  repo: z.string(),
  number: z.number().int(),
  state: z.string().nullable(),
  comments: z.number().int().nullable(),
  title: z.string().nullable(),
  author: z.string().nullable(),
})

const GitHubPullRequestPreviewMetadataSchema = z.object({
  kind: z.literal("GITHUB"),
  subtype: z.literal("PR"),
  owner: z.string(),
  repo: z.string(),
  number: z.number().int(),
  state: z.string().nullable(),
  comments: z.number().int().nullable(),
  title: z.string().nullable(),
  author: z.string().nullable(),
  merged: z.boolean().nullable(),
})

const PreviewMetadataSchema = z.union([
  GenericPreviewMetadataSchema,
  YouTubePreviewMetadataSchema,
  GitHubPreviewMetadataSchema,
  GitHubIssuePreviewMetadataSchema,
  GitHubPullRequestPreviewMetadataSchema,
])

export function parsePreviewMetadata(input: unknown): PreviewMetadata | null {
  const parsed = PreviewMetadataSchema.safeParse(input)
  return parsed.success ? parsed.data : null
}
