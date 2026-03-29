import { expect, test } from "@playwright/test"

import { disconnectTestPrisma, testPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("contact and guestbook split into preview and standalone surfaces without leaving the v0 world", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/contact")
  await expect(page.getByRole("heading", { name: "Get in Touch" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Recent visitor logs" })).toBeVisible()
  await expect(page.getByRole("link", { name: /\[open guestbook ->\]/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /\[ write log \]/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^public$/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^admin$/i })).toHaveCount(0)
  const contactColumnBox = await page.locator("[data-v0-contact-column]").boundingBox()
  const previewColumnBox = await page.locator("[data-v0-guestbook-column]").first().boundingBox()
  expect(contactColumnBox?.width ?? 0).toBeGreaterThanOrEqual(480)
  expect(previewColumnBox?.width ?? 0).toBeGreaterThanOrEqual(480)

  await page.goto("/guestbook")
  await expect(page.getByRole("heading", { name: "Visitor Log Terminal" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "System logs from visitors" })).toBeVisible()
  await expect(page.getByRole("button", { name: /\[ write log \]/i })).toBeVisible()
  await expect(page.getByRole("button", { name: /\[admin remove\]/i })).toHaveCount(0)
  const guestbookColumnBox = await page.locator("[data-v0-guestbook-column]").first().boundingBox()
  expect(guestbookColumnBox?.width ?? 0).toBeGreaterThanOrEqual(480)
})

test("notes desktop keeps row metadata inline and subscribe controls on one baseline", async ({ page }) => {
  const marker = `e2e-notes-inline-${Date.now()}`
  await testPrisma.post.create({
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
            content: [{ type: "text", text: `${marker} body` }],
          },
        ],
      },
      htmlContent: `<p>${marker} body</p>`,
      publishedAt: new Date(),
    },
  })

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/notes")

  const labelBox = await page.locator("[data-v0-stay-in-loop-label]").boundingBox()
  const input = page.getByPlaceholder("you@email.com")
  const button = page.getByRole("button", { name: "Subscribe" })
  const noteRow = page.locator("[data-v0-note-row]").first()

  const [inputBox, buttonBox, dateBox, tagsBox] = await Promise.all([
    input.boundingBox(),
    button.boundingBox(),
    noteRow.locator("span").nth(0).boundingBox(),
    noteRow.locator("span").nth(3).boundingBox(),
  ])

  expect(labelBox).not.toBeNull()
  expect(inputBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect(dateBox).not.toBeNull()
  expect(tagsBox).not.toBeNull()

  const verticalOffset = Math.abs((inputBox?.y ?? 0) - (buttonBox?.y ?? 0))
  const heightDelta = Math.abs((inputBox?.height ?? 0) - (buttonBox?.height ?? 0))
  const notesInlineOffset = Math.abs((dateBox?.y ?? 0) - (tagsBox?.y ?? 0))
  const labelInputOffset = Math.abs((labelBox?.y ?? 0) - (inputBox?.y ?? 0))

  expect(labelBox?.height ?? 0).toBeLessThanOrEqual(34)
  expect(labelInputOffset).toBeLessThanOrEqual(2)
  expect(verticalOffset).toBeLessThanOrEqual(2)
  expect(heightDelta).toBeLessThanOrEqual(2)
  expect(notesInlineOffset).toBeLessThanOrEqual(3)
})
