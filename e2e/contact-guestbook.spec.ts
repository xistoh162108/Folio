import { expect, test } from "@playwright/test"

test("contact and guestbook routes reuse the same integrated composition", async ({ page }) => {
  await page.goto("/contact")
  await expect(page.getByRole("heading", { name: "Get in Touch" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "System logs from visitors" })).toBeVisible()

  await page.goto("/guestbook")
  await expect(page.getByRole("heading", { name: "Get in Touch" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "System logs from visitors" })).toBeVisible()
})

test("notes subscribe controls stay on the same baseline", async ({ page }) => {
  await page.goto("/notes")

  const input = page.getByPlaceholder("you@email.com")
  const button = page.getByRole("button", { name: "Subscribe" })

  const [inputBox, buttonBox] = await Promise.all([input.boundingBox(), button.boundingBox()])

  expect(inputBox).not.toBeNull()
  expect(buttonBox).not.toBeNull()

  const verticalOffset = Math.abs((inputBox?.y ?? 0) - (buttonBox?.y ?? 0))
  const heightDelta = Math.abs((inputBox?.height ?? 0) - (buttonBox?.height ?? 0))

  expect(verticalOffset).toBeLessThanOrEqual(2)
  expect(heightDelta).toBeLessThanOrEqual(2)
})
