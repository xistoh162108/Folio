import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma, testPrisma } from "./helpers/db"

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9pD3sAAAAASUVORK5CYII=",
  "base64",
)

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("uploads and signed downloads respect published vs admin-only access", async ({ page, request }) => {
  await ensureAdminUser()
  const marker = `e2e-media-${Date.now()}`

  await loginAsAdmin(page)
  await page.goto("/admin/posts")
  await page.getByRole("button", { name: /\[\+\]\s*new draft/i }).click()
  await expect(page).toHaveURL(/\/admin\/posts\/[^/]+$/)

  await page.getByLabel("Title").fill(`${marker} title`)
  await page.getByText("[meta]").click()
  await expect(page.getByLabel("Slug")).toBeVisible()
  await page.getByLabel("Slug").fill(`${marker}-note`)

  await page.locator('input[accept="image/jpeg,image/png,image/webp"]').setInputFiles({
    name: `${marker}.png`,
    mimeType: "image/png",
    buffer: ONE_BY_ONE_PNG,
  })
  await expect(page.getByText("Image uploaded and linked as cover.")).toBeVisible()

  await page.locator('input[accept=".pdf,.txt,text/plain,application/pdf"]').setInputFiles({
    name: `${marker}.txt`,
    mimeType: "text/plain",
    buffer: Buffer.from(`download payload ${marker}`, "utf8"),
  })
  await expect(page.getByText("File uploaded.")).toBeVisible()

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByText("Saved.")).toBeVisible()

  const post = await testPrisma.post.findUniqueOrThrow({
    where: { slug: `${marker}-note` },
    select: {
      id: true,
      status: true,
      assets: {
        where: { kind: "FILE" },
        select: { id: true },
      },
    },
  })

  expect(post.status).toBe("PUBLISHED")

  const fileAssetId = post.assets[0]?.id
  if (!fileAssetId) {
    throw new Error("Expected uploaded file asset.")
  }

  const publicPublishedResponse = await request.get(`/api/files/${fileAssetId}`)
  expect(publicPublishedResponse.ok()).toBeTruthy()
  expect(await publicPublishedResponse.text()).toContain(`download payload ${marker}`)

  await page.getByRole("button", { name: "Archive" }).click()
  await expect(page.getByText("Archived.")).toBeVisible()

  const publicArchivedResponse = await request.get(`/api/files/${fileAssetId}`, {
    failOnStatusCode: false,
  })
  expect(publicArchivedResponse.status()).toBe(401)

  const adminArchivedResponse = await page.context().request.get(`/api/files/${fileAssetId}`)
  expect(adminArchivedResponse.ok()).toBeTruthy()
  expect(await adminArchivedResponse.text()).toContain(`download payload ${marker}`)
})
