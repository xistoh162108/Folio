import { expect, test } from "@playwright/test"

import { ensureAdminUser, loginAsAdmin } from "./helpers/admin"
import { disconnectTestPrisma } from "./helpers/db"

test.afterAll(async () => {
  await disconnectTestPrisma()
})

test("public shell keeps desktop split parity and stacks into a jitter band on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  const desktopPrimaryBox = await page.locator("[data-v0-shell-primary]").first().boundingBox()
  const desktopSlotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()

  expect(desktopPrimaryBox).not.toBeNull()
  expect(desktopSlotBox).not.toBeNull()
  expect(Math.abs((desktopPrimaryBox?.width ?? 0) - (desktopSlotBox?.width ?? 0))).toBeLessThanOrEqual(32)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")

  const mobileSlotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()
  const mobileHeadingBox = await page.getByRole("heading", { name: "Jimin Park" }).boundingBox()

  expect(mobileSlotBox).not.toBeNull()
  expect(mobileHeadingBox).not.toBeNull()
  expect(mobileSlotBox?.width ?? 0).toBeGreaterThanOrEqual(360)
  expect(mobileSlotBox?.height ?? 0).toBeGreaterThanOrEqual(140)
  expect((mobileHeadingBox?.y ?? 0) - ((mobileSlotBox?.y ?? 0) + (mobileSlotBox?.height ?? 0))).toBeGreaterThanOrEqual(0)
})

test("public shell keeps split ownership on standard and tall desktop ratios", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")

  const [standardPrimaryBox, standardSlotBox] = await Promise.all([
    page.locator("[data-v0-shell-primary]").first().boundingBox(),
    page.locator("[data-v0-jitter-slot]").first().boundingBox(),
  ])

  expect(standardPrimaryBox).not.toBeNull()
  expect(standardSlotBox).not.toBeNull()
  expect(Math.abs((standardPrimaryBox?.width ?? 0) - (standardSlotBox?.width ?? 0))).toBeLessThanOrEqual(48)

  await page.setViewportSize({ width: 1080, height: 1600 })
  await page.goto("/")

  const [tallPrimaryBox, tallSlotBox] = await Promise.all([
    page.locator("[data-v0-shell-primary]").first().boundingBox(),
    page.locator("[data-v0-jitter-slot]").first().boundingBox(),
  ])

  expect(tallPrimaryBox).not.toBeNull()
  expect(tallSlotBox).not.toBeNull()
  expect(Math.abs((tallPrimaryBox?.height ?? 0) - (tallSlotBox?.height ?? 0))).toBeLessThanOrEqual(64)
  expect(tallSlotBox?.height ?? 0).toBeGreaterThanOrEqual(1200)
})

test("tablet public shell preserves split ownership with a wider content column", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1200 })
  await page.goto("/notes")

  const primaryBox = await page.locator("[data-v0-shell-primary]").first().boundingBox()
  const slotBox = await page.locator("[data-v0-jitter-slot]").first().boundingBox()

  expect(primaryBox).not.toBeNull()
  expect(slotBox).not.toBeNull()
  expect(primaryBox?.width ?? 0).toBeGreaterThan(slotBox?.width ?? 0)
  expect(slotBox?.width ?? 0).toBeGreaterThan(300)
})

test("tablet landscape keeps split ownership without collapsing the right panel", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 720 })
  await page.goto("/projects")

  const [primaryBox, slotBox] = await Promise.all([
    page.locator("[data-v0-shell-primary]").first().boundingBox(),
    page.locator("[data-v0-jitter-slot]").first().boundingBox(),
  ])

  expect(primaryBox).not.toBeNull()
  expect(slotBox).not.toBeNull()
  expect(primaryBox?.width ?? 0).toBeGreaterThan(slotBox?.width ?? 0)
  expect(slotBox?.width ?? 0).toBeGreaterThanOrEqual(360)
})

test("notes keeps the subscribe strip reachable on mobile without a half-width fixed footer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/notes")

  const subscribeInput = page.getByPlaceholder("you@email.com")
  await subscribeInput.scrollIntoViewIfNeeded()

  const [inputBox, buttonBox] = await Promise.all([
    subscribeInput.boundingBox(),
    page.getByRole("button", { name: "Subscribe" }).boundingBox(),
  ])

  expect(inputBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()
  expect((buttonBox?.x ?? 0) + (buttonBox?.width ?? 0)).toBeLessThanOrEqual(390)
  expect((inputBox?.y ?? 0) - ((buttonBox?.y ?? 0) + (buttonBox?.height ?? 0))).toBeLessThanOrEqual(48)
})

test("mobile landscape keeps the jitter band and stacked contact content without a second shell", async ({ page }) => {
  await page.setViewportSize({ width: 740, height: 390 })
  await page.goto("/contact")

  const [slotBox, headingBox] = await Promise.all([
    page.locator("[data-v0-jitter-slot]").first().boundingBox(),
    page.getByRole("heading", { name: "Get in Touch" }).boundingBox(),
  ])

  expect(slotBox).not.toBeNull()
  expect(headingBox).not.toBeNull()
  expect(slotBox?.width ?? 0).toBeGreaterThanOrEqual(680)
  expect(slotBox?.height ?? 0).toBeGreaterThanOrEqual(120)
  expect((headingBox?.y ?? 0) - ((slotBox?.y ?? 0) + (slotBox?.height ?? 0))).toBeGreaterThanOrEqual(0)
})

test("admin shell keeps a horizontal command strip and condensed jitter band on mobile", async ({ page }) => {
  await ensureAdminUser()
  await loginAsAdmin(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/admin/analytics")

  const strip = page.locator("[data-v0-admin-strip]")
  const [stripBox, slotBox, headingBox] = await Promise.all([
    strip.boundingBox(),
    page.locator("[data-v0-jitter-slot]").first().boundingBox(),
    page.getByRole("heading", { name: "Terminal Dashboard" }).boundingBox(),
  ])

  expect(await strip.getByRole("button").count()).toBeGreaterThanOrEqual(5)
  expect(stripBox).not.toBeNull()
  expect(slotBox).not.toBeNull()
  expect(headingBox).not.toBeNull()
  expect(slotBox?.width ?? 0).toBeGreaterThanOrEqual(360)
  expect((slotBox?.y ?? 0) - ((stripBox?.y ?? 0) + (stripBox?.height ?? 0))).toBeGreaterThanOrEqual(0)
  expect((headingBox?.y ?? 0) - ((slotBox?.y ?? 0) + (slotBox?.height ?? 0))).toBeGreaterThanOrEqual(0)
})
