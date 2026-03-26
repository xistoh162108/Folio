import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ORIGINAL_ENV = { ...process.env }

describe("getCanonicalAppUrl", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("uses APP_URL in production", async () => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://auth.example.com",
      APP_URL: "https://garden.example.com",
      CRON_SECRET: "cron-secret",
    })

    const { getCanonicalAppUrl } = await import("@/lib/runtime/origin")
    expect(getCanonicalAppUrl()).toBe("https://garden.example.com")
  })

  it("falls back to NEXTAUTH_URL only outside production", async () => {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "http://127.0.0.1:3001",
      CRON_SECRET: "cron-secret",
    })
    delete process.env.APP_URL

    const { getCanonicalAppUrl } = await import("@/lib/runtime/origin")
    expect(getCanonicalAppUrl()).toBe("http://127.0.0.1:3001")
  })

  it("throws in production when APP_URL is missing", async () => {
    Object.assign(process.env, {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://garden.example.com",
      CRON_SECRET: "cron-secret",
    })
    delete process.env.APP_URL

    const { getCanonicalAppUrl } = await import("@/lib/runtime/origin")
    expect(() => getCanonicalAppUrl()).toThrow("APP_URL is required in production")
  })
})
