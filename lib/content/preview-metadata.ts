import { z } from "zod"

import type { PreviewMetadata } from "@/lib/contracts/posts"

const GenericPreviewMetadataSchema = z.object({
  kind: z.literal("GENERIC"),
})

const GitHubPreviewMetadataSchema = z.object({
  kind: z.literal("GITHUB"),
  owner: z.string(),
  repo: z.string(),
  stars: z.number().int().nullable(),
  forks: z.number().int().nullable(),
  primaryLanguage: z.string().nullable(),
  openIssues: z.number().int().nullable(),
})

const PreviewMetadataSchema = z.union([GenericPreviewMetadataSchema, GitHubPreviewMetadataSchema])

export function parsePreviewMetadata(input: unknown): PreviewMetadata | null {
  const parsed = PreviewMetadataSchema.safeParse(input)
  return parsed.success ? parsed.data : null
}
