import { expect, test } from "@playwright/test"

test("public pages and admin auth boundary are reachable", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Jimin Bag" })).toBeVisible()

  await page.goto("/knowledge")
  await expect(page.getByRole("heading", { name: "Unified notes and projects" })).toBeVisible()

  await page.goto("/guestbook")
  await expect(page.getByRole("heading", { name: "System logs from visitors" })).toBeVisible()

  await page.goto("/admin/login")
  await expect(page.getByRole("heading", { name: "System Access" })).toBeVisible()

  await page.goto("/admin/posts")
  await expect(page).toHaveURL(/\/admin\/login/)

  await page.goto("/notes")
  await expect(page.getByRole("heading", { name: "Published notes" })).toBeVisible()

  await page.goto("/projects")
  await expect(page.getByRole("heading", { name: "Published projects" })).toBeVisible()
})

test("analytics endpoint accepts a basic beacon payload", async ({ request }) => {
  const response = await request.post("/api/analytics", {
    data: {
      eventType: "PAGEVIEW",
      sessionId: "playwright-smoke-session",
      path: "/notes",
    },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body).toMatchObject({ success: true })
})

test("analytics endpoint accepts a page-load payload", async ({ request }) => {
  const response = await request.post("/api/analytics", {
    data: {
      eventType: "PAGELOAD",
      sessionId: "playwright-pageload-session",
      path: "/knowledge",
      pageLoadMs: 187,
    },
  })

  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body).toMatchObject({ success: true })
})

test("guestbook endpoint accepts a valid log and rejects honeypot spam", async ({ request }) => {
  const valid = await request.post("/api/guestbook", {
    data: {
      message: `playwright guest log ${Date.now()}`,
      _honey: "",
    },
  })

  expect(valid.ok()).toBeTruthy()
  expect(await valid.json()).toMatchObject({
    success: true,
    entry: {
      message: expect.stringContaining("playwright guest log"),
    },
  })

  const spam = await request.post("/api/guestbook", {
    data: {
      message: "spam",
      _honey: "bot-filled",
    },
  })

  expect(spam.status()).toBe(400)
})

test("comment create and PIN delete flow works on a published post", async ({ page }) => {
  await page.goto("/knowledge")

  const firstKnowledgeLink = page.locator('a[href^="/notes/"], a[href^="/projects/"]').first()
  await expect(firstKnowledgeLink).toBeVisible()
  await firstKnowledgeLink.click()

  const marker = `playwright-comment-${Date.now()}`
  const commentBox = page.getByPlaceholder('git commit -m "write your log_"')
  await commentBox.fill(marker)
  await page.getByPlaceholder("PIN_").fill("2468")
  await page.getByRole("button", { name: /\[ write log \]/i }).click()

  await expect(page.getByText(marker)).toBeVisible()

  const commentCard = page.locator("div.rounded-2xl").filter({ hasText: marker }).first()
  await commentCard.getByPlaceholder("PIN to delete").fill("2468")
  await commentCard.getByRole("button", { name: /\[ delete with pin \]/i }).click()

  await expect(page.getByText(marker)).toHaveCount(0)
})
