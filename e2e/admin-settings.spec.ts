import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("admin settings renders live readiness payload instead of a placeholder", async ({ page }) => {
  await ensureAdminUser()
  await loginAsAdmin(page)
  await page.goto("/admin/settings")

  await expect(page.getByRole("heading", { name: "Provider readiness" })).toBeVisible()
  await expect(page.getByText("DB reachable")).toBeVisible()
  await expect(page.getByText("Connected")).toBeVisible()
  await expect(page.getByText(/Prisma can execute a live read against PostgreSQL/i)).toBeVisible()
  await expect(page.getByText("Storage configured")).toBeVisible()
  await expect(page.getByText("Email configured")).toBeVisible()
  await expect(page.getByText("Worker routes ready")).toBeVisible()
  await expect(page.getByText(/ready|not ready/i).first()).toBeVisible()
})
