import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("shared runtime keeps a visible right-panel viewport on public and admin shells", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("[data-v0-jitter-slot] [data-v0-jitter-viewport]")).toHaveCount(1)

  await page.getByRole("button", { name: "/contact" }).click()
  await expect(page).toHaveURL(/\/contact$/)
  await expect(page.locator("[data-v0-jitter-slot] [data-v0-jitter-viewport]")).toHaveCount(1)

  await page.goto("/admin/login")
  await expect(page.locator("[data-v0-jitter-slot] [data-v0-jitter-viewport]")).toHaveCount(1)

  await ensureAdminUser()
  await loginAsAdmin(page)
  await page.goto("/admin/analytics")
  await expect(page.locator("[data-v0-jitter-slot] [data-v0-jitter-viewport]")).toHaveCount(1)
})

test("right-panel slot keeps full tall-screen height on public and admin access shells", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1400 })

  await page.goto("/")
  const publicSlotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()
  expect(publicSlotBox).not.toBeNull()
  expect(publicSlotBox?.height ?? 0).toBeGreaterThan(1100)

  await page.goto("/admin/login")
  const adminSlotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()
  expect(adminSlotBox).not.toBeNull()
  expect(adminSlotBox?.height ?? 0).toBeGreaterThan(1200)

  await ensureAdminUser()
  await loginAsAdmin(page)
  await page.goto("/admin/analytics")
  const adminShellSlotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()
  expect(adminShellSlotBox).not.toBeNull()
  expect(adminShellSlotBox?.height ?? 0).toBeGreaterThan(1200)
})
