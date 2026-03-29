import { expect, test } from "@playwright/test"

import { prisma } from "../lib/db/prisma"

async function ensurePublishedDetailPath() {
  const note = await prisma.post.findFirst({
    where: {
      status: "PUBLISHED",
      type: "NOTE",
    },
    select: {
      slug: true,
    },
  })

  if (note?.slug) {
    return `/notes/${note.slug}`
  }

  const project = await prisma.post.findFirst({
    where: {
      status: "PUBLISHED",
      type: "PROJECT",
    },
    select: {
      slug: true,
    },
  })

  if (project?.slug) {
    return `/projects/${project.slug}`
  }

  const marker = `playwright-smoke-${Date.now()}`
  const created = await prisma.post.create({
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
    select: {
      slug: true,
    },
  })

  return `/notes/${created.slug}`
}

test("public pages and admin auth boundary are reachable", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Jimin Park" })).toBeVisible()
  await expect(page.getByRole("button", { name: /^public$/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^admin$/i })).toHaveCount(0)

  await page.goto("/notes")
  await expect(page.getByRole("heading", { name: "Notes & Seeds" })).toBeVisible()

  await page.goto("/projects")
  await expect(page.getByRole("heading", { name: "Featured Work" })).toBeVisible()

  await page.goto("/guestbook")
  await expect(page.getByRole("heading", { name: "System logs from visitors" })).toBeVisible()

  await page.goto("/admin/login")
  await expect(page.getByRole("heading", { name: "System Access" })).toBeVisible()
  await expect(page.getByRole("button", { name: /^public$/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^admin$/i })).toHaveCount(0)

  await page.goto("/admin/posts")
  await expect(page).toHaveURL(/\/admin\/login/)

  await page.goto("/contact")
  await expect(page.getByRole("heading", { name: "Get in Touch" })).toBeVisible()
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
      path: "/notes",
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
  await page.goto(await ensurePublishedDetailPath())

  const marker = `playwright-comment-${Date.now()}`
  const commentBox = page.getByPlaceholder('git commit -m "write your log_"')
  await commentBox.fill(marker)
  await page.getByPlaceholder("PIN_").fill("2468")
  await page.getByRole("button", { name: /\[\s*write log\s*\]/i }).click()

  await expect(page.getByText(marker)).toBeVisible()

  const commentRow = page.locator("[data-comment-row]").filter({ hasText: marker }).first()
  await commentRow.getByPlaceholder("PIN_").fill("2468")
  await commentRow.getByRole("button", { name: /\[\s*delete\s*\]/i }).click()

  await expect(page.getByText(marker)).toHaveCount(0)
})
