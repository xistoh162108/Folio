import bcrypt from "bcrypt"
import type { Page } from "@playwright/test"

import { testPrisma } from "./db"

export const E2E_ADMIN_EMAIL = "e2e-admin@jimin.garden"
export const E2E_ADMIN_PASSWORD = "codex-admin-1234"

export async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash(E2E_ADMIN_PASSWORD, 10)

  await testPrisma.user.upsert({
    where: { email: E2E_ADMIN_EMAIL },
    update: { password: passwordHash },
    create: {
      email: E2E_ADMIN_EMAIL,
      password: passwordHash,
    },
  })
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login")
  await page.getByPlaceholder("Identify_").fill(E2E_ADMIN_EMAIL)
  await page.getByPlaceholder("Passphrase_").fill(E2E_ADMIN_PASSWORD)
  await page.getByRole("button", { name: /\[\s*initiate override_\s*\]/i }).click()
  await page.waitForURL(/\/admin\/posts/)
}
