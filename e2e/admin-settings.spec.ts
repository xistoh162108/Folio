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
  await page.setViewportSize({ width: 1280, height: 720 })

  const marker = `playwright-profile-${Date.now()}`
  const displayName = `${marker} Jimin`
  const emailAddress = `${marker}@xistoh.com`
  const summary = `${marker} profile summary`
  const role = `${marker} role`

  await page.goto("/admin/settings")

  await expect(page.getByRole("heading", { name: "Profile & CV Editor" })).toBeVisible()
  await expect(page.getByText(/\[database\] live source/i)).toBeVisible()
  const scrollMetrics = await page.locator("[data-v0-settings-scroll]").evaluate((element) => {
    const target = element as HTMLElement
    target.scrollTop = 0
    const clientHeight = target.clientHeight
    const scrollHeight = target.scrollHeight
    target.scrollTop = scrollHeight
    return {
      clientHeight,
      scrollHeight,
      scrollTop: target.scrollTop,
    }
  })
  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight)
  expect(scrollMetrics.scrollTop).toBeGreaterThan(0)
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

test("admin settings keeps command-strip layout and scroll access on mobile", async ({ page }) => {
  await ensureAdminUser()
  await resetPrimaryProfile()
  await loginAsAdmin(page)
  await page.setViewportSize({ width: 390, height: 844 })

  await page.goto("/admin/settings")

  await expect(page.locator("[data-v0-admin-strip]")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Profile & CV Editor" })).toBeVisible()
  const mobileScroll = await page.locator("[data-v0-shell-primary]").evaluate((element) => {
    const target = element as HTMLElement
    target.scrollTop = 0
    const clientHeight = target.clientHeight
    const scrollHeight = target.scrollHeight
    target.scrollTop = scrollHeight
    return {
      clientHeight,
      scrollHeight,
      scrollTop: target.scrollTop,
    }
  })

  expect(mobileScroll.scrollHeight).toBeGreaterThan(mobileScroll.clientHeight)
  expect(mobileScroll.scrollTop).toBeGreaterThan(0)
  await expect(page.getByRole("button", { name: /\[save profile\]|\[saved\]|\[save failed\]/i })).toBeVisible()
})
