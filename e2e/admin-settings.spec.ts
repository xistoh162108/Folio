import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"
import { resetPrimaryProfile } from "./helpers/profile"

test.afterAll(async () => {
  await resetPrimaryProfile()
  await disconnectTestPrisma()
})

test("admin settings owns the live profile runtime and updates home, contact, guestbook, and resume", async ({ page }) => {
  await ensureAdminUser()
  await resetPrimaryProfile()
  await loginAsAdmin(page)

  const marker = `playwright-profile-${Date.now()}`
  const displayName = `${marker} Jimin`
  const emailAddress = `${marker}@xistoh.com`
  const summary = `${marker} profile summary`
  const role = `${marker} role`

  await page.goto("/admin/settings")

  await expect(page.getByRole("heading", { name: "Profile & CV Editor" })).toBeVisible()
  await page.getByLabel("Display Name").fill(displayName)
  await page.getByLabel("Email").fill(emailAddress)
  await page.getByLabel("Role").fill(role)
  await page.getByLabel("Bio").fill(summary)
  await page.getByRole("button", { name: "Add link" }).click()
  await page.getByPlaceholder("Label").last().fill("GitHub")
  await page.getByPlaceholder("URL").last().fill(`https://github.com/${marker}`)
  await page.getByRole("button", { name: /\[github\]/i }).last().click()
  await page.getByRole("button", { name: /\[pending\]/i }).last().click()
  await page.getByRole("button", { name: /\[save profile\]|\[saved\]|\[save failed\]/i }).click()

  await expect(page.getByText("Profile runtime updated.")).toBeVisible()

  await page.goto("/")
  await expect(page.getByRole("heading", { name: displayName })).toBeVisible()
  await expect(page.getByText(summary)).toBeVisible()

  await page.goto("/contact")
  await expect(page.getByText(emailAddress)).toBeVisible()

  await page.goto("/guestbook")
  await expect(page.getByText(emailAddress)).toBeVisible()

  const resumeResponse = await page.request.get("/resume.pdf")
  expect(resumeResponse.ok()).toBeTruthy()
  const resumeBody = (await resumeResponse.body()).toString("utf8")
  expect(resumeBody).toContain(displayName)
  expect(resumeBody).toContain(role)
  expect(resumeBody).toContain(summary)
})
