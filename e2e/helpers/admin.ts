import bcrypt from "bcrypt"
import type { Page } from "@playwright/test"

import { testPrisma } from "./db"

export const E2E_ADMIN_EMAIL = "e2e-admin@xistoh.com"
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
  const request = page.context().request
  const csrfResponse = await request.get("/api/auth/csrf")

  if (!csrfResponse.ok()) {
    throw new Error(`Failed to load NextAuth CSRF token (${csrfResponse.status()}).`)
  }

  const csrfPayload = (await csrfResponse.json()) as { csrfToken?: string }
  if (!csrfPayload.csrfToken) {
    throw new Error("Missing NextAuth CSRF token.")
  }

  const loginResponse = await request.post("/api/auth/callback/credentials?json=true", {
    form: {
      csrfToken: csrfPayload.csrfToken,
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
      callbackUrl: "/admin/analytics",
      json: "true",
    },
    failOnStatusCode: false,
  })

  const loginBody = await loginResponse.text()
  if (!loginResponse.ok() || loginBody.includes("CredentialsSignin")) {
    throw new Error(`Admin test sign-in failed (${loginResponse.status()}).`)
  }

  await page.goto("/admin/analytics")
  await page.waitForURL(/\/admin\/(analytics|posts)/)
}
