import { expect, type Page } from "@playwright/test"
import bcrypt from "bcrypt"

import { ensureAdminUser, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } from "./admin"
import { disconnectTestPrisma, testPrisma as prisma } from "./db"

export interface CommunityFixtures {
  marker: string
  postId: string
  postSlug: string
  commentId: string
  commentMessage: string
  guestbookEntryId: string
  guestbookMessage: string
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login")
  await page.getByPlaceholder("Identify_").fill(E2E_ADMIN_EMAIL)
  await page.getByPlaceholder("Passphrase_").fill(E2E_ADMIN_PASSWORD)
  await page.getByRole("button", { name: /\[\s*initiate override_\s*\]/i }).click()
  await page.waitForURL(/\/admin\/posts/)
}

export async function seedCommunityFixtures(): Promise<CommunityFixtures> {
  const marker = `e2e-community-${Date.now()}`
  await ensureAdminUser()

  const post = await prisma.post.create({
    data: {
      slug: `${marker}-note`,
      type: "NOTE",
      status: "PUBLISHED",
      title: `${marker} title`,
      excerpt: `${marker} excerpt`,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `${marker} detail body` }],
          },
        ],
      },
      htmlContent: `<p>${marker} detail body</p>`,
      publishedAt: new Date(),
    },
  })

  const commentMessage = `${marker} comment`
  const guestbookMessage = `${marker} guestbook`

  const comment = await prisma.postComment.create({
    data: {
      postId: post.id,
      message: commentMessage,
      pinHash: await bcrypt.hash("2468", 10),
      ipHash: marker,
      userAgent: "Playwright E2E",
    },
  })

  const guestbookEntry = await prisma.guestbookEntry.create({
    data: {
      message: guestbookMessage,
      ipHash: marker,
      userAgent: "Playwright E2E",
    },
  })

  return {
    marker,
    postId: post.id,
    postSlug: post.slug,
    commentId: comment.id,
    commentMessage,
    guestbookEntryId: guestbookEntry.id,
    guestbookMessage,
  }
}

export async function expectCommunitySoftDeleted(fixtures: CommunityFixtures) {
  await expect
    .poll(
      async () => {
        const [comment, guestbookEntry] = await Promise.all([
          prisma.postComment.findUnique({
            where: { id: fixtures.commentId },
            select: { deletedAt: true },
          }),
          prisma.guestbookEntry.findUnique({
            where: { id: fixtures.guestbookEntryId },
            select: { deletedAt: true },
          }),
        ])

        return {
          commentDeleted: Boolean(comment?.deletedAt),
          guestbookDeleted: Boolean(guestbookEntry?.deletedAt),
        }
      },
      {
        message: "Expected moderation actions to set deletedAt for both records.",
        timeout: 10_000,
      },
    )
    .toEqual({
      commentDeleted: true,
      guestbookDeleted: true,
    })
}

export async function cleanupCommunityFixtures(fixtures: CommunityFixtures) {
  await prisma.postComment.deleteMany({
    where: {
      OR: [{ id: fixtures.commentId }, { ipHash: fixtures.marker }],
    },
  })

  await prisma.guestbookEntry.deleteMany({
    where: {
      OR: [{ id: fixtures.guestbookEntryId }, { ipHash: fixtures.marker }],
    },
  })

  await prisma.post.deleteMany({
    where: {
      OR: [{ id: fixtures.postId }, { slug: fixtures.postSlug }],
    },
  })
}

export async function disconnectCommunityTestClient() {
  await disconnectTestPrisma()
}
