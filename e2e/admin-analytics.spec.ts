import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("admin analytics fails closed when test storage is active under the production server", async ({ page }) => {
  await ensureAdminUser()
  await loginAsAdmin(page)
  await page.goto("/admin/analytics")

  await expect(page.getByText("Storage configured")).toBeVisible()
  await expect(page.getByText("Test storage driver is not allowed in production.")).toBeVisible()
  await expect(page.getByText("post-media bucket")).toBeVisible()
  await expect(page.getByText("post-files bucket")).toBeVisible()
  await expect(page.getByText("Test storage driver is configured but forbidden in production.").first()).toBeVisible()
  await expect(page.getByText("missing").first()).toBeVisible()
})

test("admin analytics reports performance diagnostics inside the existing terminal surface", async ({ page }) => {
  await ensureAdminUser()
  await loginAsAdmin(page)

  await page.goto("/admin/analytics")
  await page.getByRole("button", { name: "Manage Posts" }).click()
  await page.waitForURL(/\/admin\/posts/)
  await page.getByRole("button", { name: "Analytics" }).click()
  await page.waitForURL(/\/admin\/analytics/)

  await expect(page.locator("[data-v0-admin-performance]")).toBeVisible()
  await expect(page.locator("[data-v0-service-log]")).toBeVisible()
  await expect(page.getByText("SESSION_LOOKUP")).toBeVisible()
  await expect(page.getByText("POST_INDEX_QUERY")).toBeVisible()
  await expect(page.getByText("SETTINGS_EDITOR_LOAD")).toBeVisible()
  await expect(page.getByText("NEWSLETTER_DASHBOARD")).toBeVisible()
  await expect(page.getByText("COMMUNITY_QUEUE")).toBeVisible()
  await expect(page.getByText("RECENT_NAV")).toBeVisible()
  await expect(page.getByText("PANEL_HANDOFF")).toBeVisible()
  await expect(page.getByText("idle-neighbors + hover/focus")).toBeVisible()
})
