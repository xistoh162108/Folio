import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9pD3sAAAAASUVORK5CYII=",
  "base64",
)

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("production server fails closed for editor uploads while test storage driver is active", async ({ page }) => {
  await ensureAdminUser()
  const marker = `e2e-media-${Date.now()}`

  await loginAsAdmin(page)
  await page.goto("/admin/posts")
  await page.getByRole("button", { name: /\[\+\]\s*new draft/i }).click()
  await expect(page).toHaveURL(/\/admin\/posts\/[^/]+$/)

  await page.getByLabel("Title").fill(`${marker} title`)
  const postId = page.url().split("/").at(-1)
  expect(postId).toBeTruthy()

  const uploadResponse = await page.context().request.post("/api/admin/uploads", {
    multipart: {
      kind: "image",
      postId: postId!,
      file: {
        name: `${marker}.png`,
        mimeType: "image/png",
        buffer: ONE_BY_ONE_PNG,
      },
    },
  })
  expect(uploadResponse.status()).toBe(503)
  await expect(await uploadResponse.json()).toMatchObject({
    error: "STORAGE_DRIVER=test is not allowed in production. Switch to Supabase storage before deploy.",
  })
  await expect(page.getByLabel("Markdown body")).not.toHaveValue(/asset:\/\//)
})
