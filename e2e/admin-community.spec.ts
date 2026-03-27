import { expect, test } from "@playwright/test"

import {
  cleanupCommunityFixtures,
  disconnectCommunityTestClient,
  expectCommunitySoftDeleted,
  loginAsAdmin,
  seedCommunityFixtures,
} from "./helpers/community"

test.afterAll(async () => {
  await disconnectCommunityTestClient()
})

test("admin moderation soft-deletes comments and guestbook entries end-to-end", async ({ page }) => {
  const fixtures = await seedCommunityFixtures()

  try {
    await page.goto("/admin/community")
    await expect(page).toHaveURL(/\/admin\/login/)

    await loginAsAdmin(page)
    await page.goto("/admin/community")

    await expect(page.getByText(fixtures.commentMessage)).toBeVisible()
    await expect(page.getByText(fixtures.guestbookMessage)).toBeVisible()

    const deleteButtons = page.getByRole("button", { name: /\[delete\]/i })
    await deleteButtons.first().click()
    await expect(page.getByText(fixtures.commentMessage)).toHaveCount(0)

    await deleteButtons.first().click()
    await expect(page.getByText(fixtures.guestbookMessage)).toHaveCount(0)

    await page.goto("/guestbook")
    await expect(page.getByText(fixtures.guestbookMessage)).toHaveCount(0)

    await page.goto(`/notes/${fixtures.postSlug}`)
    await expect(page.getByText(fixtures.commentMessage)).toHaveCount(0)

    await expectCommunitySoftDeleted(fixtures)
  } finally {
    await cleanupCommunityFixtures(fixtures)
  }
})
