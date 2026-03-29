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
  const draftSearch = `${marker} draft`

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
  const editorContract = await page.locator("[data-v0-editor-textarea]").evaluate((textareaElement) => {
    const textarea = textareaElement as HTMLTextAreaElement
    const mirror = document.querySelector("[data-v0-editor-mirror]") as HTMLElement | null
    if (!mirror) {
      throw new Error("Editor mirror was not found.")
    }

    const textareaStyle = window.getComputedStyle(textarea)
    const mirrorStyle = window.getComputedStyle(mirror)

    return {
      fontFamily: textareaStyle.fontFamily === mirrorStyle.fontFamily,
      fontSize: textareaStyle.fontSize === mirrorStyle.fontSize,
      lineHeight: textareaStyle.lineHeight === mirrorStyle.lineHeight,
      letterSpacing: textareaStyle.letterSpacing === mirrorStyle.letterSpacing,
      paddingTop: textareaStyle.paddingTop === mirrorStyle.paddingTop,
      paddingRight: textareaStyle.paddingRight === mirrorStyle.paddingRight,
      paddingBottom: textareaStyle.paddingBottom === mirrorStyle.paddingBottom,
      paddingLeft: textareaStyle.paddingLeft === mirrorStyle.paddingLeft,
      whiteSpace: textareaStyle.whiteSpace === mirrorStyle.whiteSpace,
      overflowWrap: textareaStyle.overflowWrap === mirrorStyle.overflowWrap,
      overflowX: textareaStyle.overflowX === mirrorStyle.overflowX,
      overflowY: textareaStyle.overflowY === mirrorStyle.overflowY,
      boxSizing: textareaStyle.boxSizing === mirrorStyle.boxSizing,
    }
  })
  expect(Object.values(editorContract).every(Boolean)).toBeTruthy()
  await expect(page.getByText("[meta]")).toHaveCount(0)
  await page.getByLabel("Markdown body").fill(Array.from({ length: 48 }, (_, index) => `# ${marker} draft ${index}\n\nBody content ${index}`).join("\n"))
  const scrollSync = await page.locator("[data-v0-editor-textarea]").evaluate((textareaElement) => {
    const textarea = textareaElement as HTMLTextAreaElement
    const mirror = document.querySelector("[data-v0-editor-mirror]") as HTMLElement | null
    if (!mirror) {
      throw new Error("Editor mirror was not found.")
    }

    textarea.scrollTop = textarea.scrollHeight
    textarea.dispatchEvent(new Event("scroll", { bubbles: true }))

    return {
      textareaScrollTop: textarea.scrollTop,
      mirrorScrollTop: mirror.scrollTop,
    }
  })
  expect(Math.abs(scrollSync.textareaScrollTop - scrollSync.mirrorScrollTop)).toBeLessThanOrEqual(1)
  await page.getByRole("button", { name: "Save Draft" }).click()
  await expect(page.getByText("Saved.")).toBeVisible()
  await expect(page).toHaveURL(`/admin/posts/${draftId}`)

  await page.goto(`/admin/posts?q=${draftSearch}`)
  await expect(page.getByText(`${marker} draft`)).toBeVisible()

  const savedDraft = await testPrisma.post.findUniqueOrThrow({
    where: { id: draftId },
    select: {
      slug: true,
      markdownSource: true,
      contentVersion: true,
      content: true,
      htmlContent: true,
    },
  })

  expect(savedDraft.slug.length).toBeGreaterThan(0)
  expect(savedDraft.markdownSource).toContain(`# ${marker} draft 0`)
  expect(savedDraft.contentVersion).toBeGreaterThanOrEqual(100)
  expect(savedDraft.htmlContent).toContain(`<h1>${marker} draft 0</h1>`)
  expect(savedDraft.content).toMatchObject({
    type: "doc",
    version: expect.any(Number),
  })
})
