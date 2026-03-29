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
    await expect(page.locator('[data-v0-embed-block="youtube"] [data-v0-embed-summary]')).toBeVisible()
    await page.locator('[data-v0-embed-block="youtube"] [data-v0-embed-summary]').click()
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

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/projects/${projectSlug}`)
    await expect(page.getByText("release log")).toBeVisible()
    await expect(page.locator('[data-v0-embed-block="github"]')).toBeVisible()
  } finally {
    await testPrisma.linkPreviewCache.deleteMany({
      where: { normalizedUrl: githubUrl },
    })
    await cleanupPosts([projectSlug])
  }
})

test("detail readers render GitHub issue and PR subtype rows across additional viewport classes", async ({ page }) => {
  const marker = `e2e-detail-github-subtypes-${Date.now()}`
  const slug = `${marker}-project`
  const issueUrl = "https://github.com/octocat/Hello-World/issues/1347"
  const prUrl = "https://github.com/octocat/Hello-World/pull/1555"
  const payload = buildMarkdownWriterPayload(
    [
      "## shipping queue",
      "",
      issueUrl,
      "",
      prUrl,
    ].join("\n"),
  )

  await testPrisma.post.create({
    data: {
      slug,
      type: "PROJECT",
      status: "PUBLISHED",
      title: `${marker} project`,
      excerpt: `${marker} excerpt`,
      markdownSource: payload.markdownSource,
      contentVersion: payload.contentVersion,
      content: payload.content as unknown as Prisma.InputJsonValue,
      htmlContent: payload.htmlContent,
      publishedAt: new Date(),
    },
  })

  await Promise.all([
    testPrisma.linkPreviewCache.upsert({
      where: { normalizedUrl: issueUrl },
      update: {
        title: "Fix jitter handoff",
        description: "Issue preview coverage",
        siteName: "GitHub",
        previewStatus: "READY",
        metadata: {
          kind: "GITHUB",
          subtype: "ISSUE",
          owner: "octocat",
          repo: "Hello-World",
          number: 1347,
          state: "open",
          comments: 12,
          title: "Fix jitter handoff",
          author: "octocat",
        },
      },
      create: {
        url: issueUrl,
        normalizedUrl: issueUrl,
        title: "Fix jitter handoff",
        description: "Issue preview coverage",
        siteName: "GitHub",
        previewStatus: "READY",
        metadata: {
          kind: "GITHUB",
          subtype: "ISSUE",
          owner: "octocat",
          repo: "Hello-World",
          number: 1347,
          state: "open",
          comments: 12,
          title: "Fix jitter handoff",
          author: "octocat",
        },
      },
    }),
    testPrisma.linkPreviewCache.upsert({
      where: { normalizedUrl: prUrl },
      update: {
        title: "Ship runtime parity lock",
        description: "PR preview coverage",
        siteName: "GitHub",
        previewStatus: "READY",
        metadata: {
          kind: "GITHUB",
          subtype: "PR",
          owner: "octocat",
          repo: "Hello-World",
          number: 1555,
          state: "closed",
          comments: 6,
          title: "Ship runtime parity lock",
          author: "octocat",
          merged: true,
        },
      },
      create: {
        url: prUrl,
        normalizedUrl: prUrl,
        title: "Ship runtime parity lock",
        description: "PR preview coverage",
        siteName: "GitHub",
        previewStatus: "READY",
        metadata: {
          kind: "GITHUB",
          subtype: "PR",
          owner: "octocat",
          repo: "Hello-World",
          number: 1555,
          state: "closed",
          comments: 6,
          title: "Ship runtime parity lock",
          author: "octocat",
          merged: true,
        },
      },
    }),
  ])

  try {
    await page.goto(`/projects/${slug}`)
    await expect(page.getByText("shipping queue")).toBeVisible()
    await expect(page.locator('[data-v0-embed-block="github"]').getByText("[issue #1347]").first()).toBeVisible()
    await expect(page.locator('[data-v0-embed-block="github"]').getByText("[pr #1555]").first()).toBeVisible()
    await expect(page.locator('[data-v0-embed-block="github"]').getByText("[merged]").first()).toBeVisible()

    await page.setViewportSize({ width: 820, height: 1180 })
    await page.goto(`/projects/${slug}`)
    await expect(page.locator('[data-v0-embed-block="github"]')).toHaveCount(2)
    await expect(page.getByText("[state open]")).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 1400 })
    await page.goto(`/projects/${slug}`)
    await expect(page.getByText("[comments 6]")).toBeVisible()
  } finally {
    await testPrisma.linkPreviewCache.deleteMany({
      where: {
        normalizedUrl: {
          in: [issueUrl, prUrl],
        },
      },
    })
    await cleanupPosts([slug])
  }
})

test("detail readers keep generic embed fallback and body media fidelity on mobile", async ({ page }) => {
  const marker = `e2e-detail-mobile-${Date.now()}`
  const slug = `${marker}-note`
  const payload = buildMarkdownWriterPayload(
    [
      "## mobile trace",
      "",
      "https://example.com/mobile-detail",
      "",
      '![mobile capture](https://example.com/mobile-detail.png "mobile capture")',
    ].join("\n"),
  )

  await testPrisma.post.create({
    data: {
      slug,
      type: "NOTE",
      status: "PUBLISHED",
      title: `${marker} note`,
      excerpt: `${marker} excerpt`,
      markdownSource: payload.markdownSource,
      contentVersion: payload.contentVersion,
      content: payload.content as unknown as Prisma.InputJsonValue,
      htmlContent: payload.htmlContent,
      publishedAt: new Date(),
    },
  })

  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/notes/${slug}`)
    await expect(page.getByText("mobile trace")).toBeVisible()
    await expect(page.getByText("mobile capture")).toBeVisible()
    await expect(page.getByText("example.com ->")).toBeVisible()
  } finally {
    await cleanupPosts([slug])
  }
})
