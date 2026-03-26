import { prisma } from "@/lib/db/prisma"
import { fetchLinkPreview, normalizeExternalUrl, toPostLinkDTO } from "@/lib/content/link-preview"
import { isMissingTableError } from "@/lib/db/errors"

async function main() {
  const posts = await prisma.post.findMany({
    where: {
      OR: [{ githubUrl: { not: null } }, { demoUrl: { not: null } }, { docsUrl: { not: null } }],
    },
    select: {
      id: true,
      githubUrl: true,
      demoUrl: true,
      docsUrl: true,
    },
  })

  let createdCount = 0

  for (const post of posts) {
    const candidates = [
      post.githubUrl ? { label: "GitHub", url: post.githubUrl, type: "GITHUB" as const } : null,
      post.demoUrl ? { label: "Live Demo", url: post.demoUrl, type: "WEBSITE" as const } : null,
      post.docsUrl ? { label: "Docs", url: post.docsUrl, type: "DOCS" as const } : null,
    ].filter((candidate): candidate is { label: string; url: string; type: "GITHUB" | "WEBSITE" | "DOCS" } => Boolean(candidate))

    for (const [index, candidate] of candidates.entries()) {
      const normalizedUrl = normalizeExternalUrl(candidate.url)
      const existing = await prisma.postLink.findFirst({
        where: {
          postId: post.id,
          normalizedUrl,
        },
      })

      if (existing) {
        continue
      }

      const preview = await fetchLinkPreview(candidate.url)
      const dto = toPostLinkDTO({
        ...preview,
        label: candidate.label,
      })

      await prisma.linkPreviewCache.upsert({
        where: { normalizedUrl: preview.normalizedUrl },
        update: {
          url: preview.url,
          title: dto.title ?? null,
          description: dto.description ?? null,
          imageUrl: dto.imageUrl ?? null,
          siteName: dto.siteName ?? null,
          embedUrl: dto.embedUrl ?? null,
          previewStatus: dto.previewStatus ?? "FAILED",
          failureReason: preview.failureReason,
          lastFetchedAt: new Date(),
        },
        create: {
          url: preview.url,
          normalizedUrl: preview.normalizedUrl,
          title: dto.title ?? null,
          description: dto.description ?? null,
          imageUrl: dto.imageUrl ?? null,
          siteName: dto.siteName ?? null,
          embedUrl: dto.embedUrl ?? null,
          previewStatus: dto.previewStatus ?? "FAILED",
          failureReason: preview.failureReason,
          lastFetchedAt: new Date(),
        },
      })

      await prisma.postLink.create({
        data: {
          postId: post.id,
          label: candidate.label,
          url: preview.url,
          normalizedUrl: preview.normalizedUrl,
          type: candidate.type,
          sortOrder: index,
        },
      })

      createdCount += 1
    }
  }

  console.log(`[backfill-post-links] created ${createdCount} link records across ${posts.length} posts`)
}

main()
  .catch((error) => {
    if (isMissingTableError(error, "PostLink") || isMissingTableError(error, "LinkPreviewCache")) {
      console.error("[backfill-post-links] missing migration. Apply the latest Prisma migrations first.")
      process.exit(1)
    }

    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
