import { expect, test } from "@playwright/test"
import { Prisma } from "@prisma/client"

import { buildMarkdownWriterPayload } from "../lib/content/markdown-blocks"
import { disconnectTestPrisma, testPrisma } from "./helpers/db"

async function cleanupPosts(slugs: string[]) {
  await testPrisma.postLink.deleteMany({
    where: {
      post: {
        slug: { in: slugs },
      },
    },
  })

  await testPrisma.post.deleteMany({
    where: {
      slug: { in: slugs },
    },
  })
}

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("note detail reader supports mixed legacy and block content safely", async ({ page }) => {
  const marker = `e2e-detail-${Date.now()}`
  const blockSlug = `${marker}-block-note`
  const legacySlug = `${marker}-legacy-note`

  const blockPayload = buildMarkdownWriterPayload(
    [
      "## block section",
      "",
      "This reader should keep **terminal density** while supporting new content.",
      "",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "",
      '![diagram](https://example.com/diagram.png "capture diagram")',
    ].join("\n"),
  )

  await testPrisma.post.create({
    data: {
      slug: blockSlug,
      type: "NOTE",
      status: "PUBLISHED",
      title: `${marker} block note`,
      excerpt: `${marker} excerpt`,
      markdownSource: blockPayload.markdownSource,
      contentVersion: blockPayload.contentVersion,
      content: blockPayload.content as unknown as Prisma.InputJsonValue,
      htmlContent: blockPayload.htmlContent,
      publishedAt: new Date(),
    },
  })

  await testPrisma.post.create({
    data: {
      slug: legacySlug,
      type: "NOTE",
      status: "PUBLISHED",
      title: `${marker} legacy note`,
      excerpt: `${marker} legacy excerpt`,
      contentVersion: 1,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Legacy Section" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: `${marker} legacy body` }],
          },
        ],
      },
      htmlContent: `<h2>Legacy Section</h2><p>${marker} legacy body</p>`,
      publishedAt: new Date(),
    },
  })

  try {
    await page.goto(`/notes/${blockSlug}`)
    await expect(page.getByText("block section")).toBeVisible()
    await expect(page.getByText("capture diagram")).toBeVisible()
    await expect(page.getByRole("button", { name: /\[expand\]/i })).toBeVisible()
    await page.getByRole("button", { name: /\[expand\]/i }).click()
    await expect(page.locator("iframe").first()).toBeVisible()

    await page.goto(`/notes/${legacySlug}`)
    await expect(page.getByText("Legacy Section")).toBeVisible()
    await expect(page.getByText(`${marker} legacy body`)).toBeVisible()
  } finally {
    await cleanupPosts([blockSlug, legacySlug])
  }
})

test("project detail reader renders GitHub preview rows inside the v0 reading surface", async ({ page }) => {
  const marker = `e2e-project-detail-${Date.now()}`
  const projectSlug = `${marker}-project`
  const githubUrl = "https://github.com/octocat/Hello-World"
  const projectPayload = buildMarkdownWriterPayload(
    [
      "## release log",
      "",
      "https://github.com/octocat/Hello-World",
    ].join("\n"),
  )

  await testPrisma.post.create({
    data: {
      slug: projectSlug,
      type: "PROJECT",
      status: "PUBLISHED",
      title: `${marker} project`,
      excerpt: `${marker} project excerpt`,
      markdownSource: projectPayload.markdownSource,
      contentVersion: projectPayload.contentVersion,
      content: projectPayload.content as unknown as Prisma.InputJsonValue,
      htmlContent: projectPayload.htmlContent,
      publishedAt: new Date(),
      tags: {
        create: [
          { name: `${marker}-Next.js`, normalizedName: `${marker}-nextjs` },
          { name: `${marker}-Prisma`, normalizedName: `${marker}-prisma` },
        ],
      },
    },
  })

  await testPrisma.linkPreviewCache.upsert({
    where: { normalizedUrl: githubUrl },
    update: {
      title: "octocat/Hello-World",
      description: "Repository preview for detail reader coverage",
      siteName: "GitHub",
      previewStatus: "READY",
      metadata: {
        kind: "GITHUB",
        owner: "octocat",
        repo: "Hello-World",
        stars: 42,
        forks: 7,
        primaryLanguage: "TypeScript",
        openIssues: 3,
      },
    },
    create: {
      url: githubUrl,
      normalizedUrl: githubUrl,
      title: "octocat/Hello-World",
      description: "Repository preview for detail reader coverage",
      siteName: "GitHub",
      previewStatus: "READY",
      metadata: {
        kind: "GITHUB",
        owner: "octocat",
        repo: "Hello-World",
        stars: 42,
        forks: 7,
        primaryLanguage: "TypeScript",
        openIssues: 3,
      },
    },
  })

  try {
    await page.goto(`/projects/${projectSlug}`)
    await expect(page.getByText("release log")).toBeVisible()
    await expect(page.getByText("octocat/Hello-World").first()).toBeVisible()
    await expect(page.getByText("[★ 42]")).toBeVisible()
    await expect(page.getByText("[issues 3]")).toBeVisible()
  } finally {
    await testPrisma.linkPreviewCache.deleteMany({
      where: { normalizedUrl: githubUrl },
    })
    await cleanupPosts([projectSlug])
  }
})
