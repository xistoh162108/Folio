import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma, testPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("admin posts uses the canonical /admin/posts flow for listing and editing", async ({ page }) => {
  await ensureAdminUser()
  const marker = `e2e-admin-posts-${Date.now()}`
  const publishedSlug = `${marker}-published`
  const draftSearch = `${marker}-draft`

  await testPrisma.post.createMany({
    data: [
      {
        slug: publishedSlug,
        type: "PROJECT",
        status: "PUBLISHED",
        title: `${marker} published`,
        excerpt: `${marker} excerpt`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: marker }] }] },
        htmlContent: `<p>${marker}</p>`,
        publishedAt: new Date(),
      },
      {
        slug: `${marker}-archived`,
        type: "NOTE",
        status: "ARCHIVED",
        title: `${marker} archived`,
        excerpt: `${marker} archived excerpt`,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: marker }] }] },
        htmlContent: `<p>${marker}</p>`,
      },
      ...Array.from({ length: 11 }, (_, index) => ({
        slug: `${marker}-page-${index}`,
        type: "NOTE" as const,
        status: "DRAFT" as const,
        title: `${marker} page ${index}`,
        excerpt: `${marker} page ${index}`,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        htmlContent: "",
      })),
    ],
  })

  await page.goto("/admin/posts")
  await expect(page).toHaveURL(/\/admin\/login/)

  await loginAsAdmin(page)
  await page.goto("/admin/posts")
  await expect(page).toHaveURL("/admin/posts")

  await page.getByRole("textbox", { name: "Search" }).fill(publishedSlug)
  await Promise.all([
    page.waitForURL(new RegExp(`/admin/posts\\?q=${publishedSlug}`)),
    page.getByRole("button", { name: "Apply" }).click(),
  ])
  await expect(page.getByText(`${marker} published`)).toBeVisible()

  await Promise.all([
    page.waitForURL(new RegExp(`/admin/posts\\?q=${publishedSlug}.*status=PUBLISHED`)),
    page.getByRole("link", { name: "Status published" }).click(),
  ])
  await expect(page.getByText(`${marker} published`)).toBeVisible()
  await expect(page.getByText(`${marker} archived`)).toHaveCount(0)

  await Promise.all([
    page.waitForURL(new RegExp(`/admin/posts\\?q=${publishedSlug}.*status=PUBLISHED.*type=PROJECT`)),
    page.getByRole("link", { name: "Type project" }).click(),
  ])
  await expect(page.getByText(`${marker} published`)).toBeVisible()

  await page.goto(`/admin/posts?q=${marker}-page&page=2`)
  await expect(page.getByRole("link", { name: "Prev" })).toBeVisible()

  await page.goto("/admin/posts")
  await Promise.all([
    page.waitForURL(/\/admin\/posts\/[^/]+$/),
    page.getByRole("button", { name: /\[\+\]\s*new draft/i }).click(),
  ])

  const currentUrl = new URL(page.url())
  const draftId = currentUrl.pathname.split("/").pop()
  if (!draftId) {
    throw new Error("Draft editor URL did not include a post id.")
  }

  await page.getByLabel("Title").fill(`${marker} draft`)
  await page.getByLabel("Markdown body").fill(`# ${marker} draft\n\nBody content`)
  await page.getByText("[meta]").click()
  await expect(page.getByLabel("Slug")).toBeVisible()
  await page.getByLabel("Slug").fill(`${marker}-draft`)
  await page.getByRole("button", { name: "Save Draft" }).click()
  await expect(page.getByText("Saved.")).toBeVisible()
  await expect(page).toHaveURL(`/admin/posts/${draftId}`)

  await page.goto(`/admin/posts?q=${draftSearch}`)
  await expect(page.getByText(`${marker} draft`)).toBeVisible()

  const savedDraft = await testPrisma.post.findUniqueOrThrow({
    where: { id: draftId },
    select: {
      markdownSource: true,
      contentVersion: true,
      content: true,
      htmlContent: true,
    },
  })

  expect(savedDraft.markdownSource).toContain(`# ${marker} draft`)
  expect(savedDraft.contentVersion).toBeGreaterThanOrEqual(100)
  expect(savedDraft.htmlContent).toContain(`<h1>${marker} draft</h1>`)
  expect(savedDraft.content).toMatchObject({
    type: "doc",
    version: expect.any(Number),
  })
})
