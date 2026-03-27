import { existsSync, readFileSync } from "fs"
import path from "path"

const TEST_MAPPINGS = [
  ["DATABASE_URL_TEST", "DATABASE_URL"],
  ["DIRECT_URL_TEST", "DIRECT_URL"],
  ["NEXTAUTH_URL_TEST", "NEXTAUTH_URL"],
  ["APP_URL_TEST", "APP_URL"],
  ["CRON_SECRET_TEST", "CRON_SECRET"],
] as const

export function loadTestEnvironment() {
  const runtimeEnv = process.env as Record<string, string | undefined>

  if (runtimeEnv.__JIMIN_GARDEN_TEST_ENV_LOADED === "1") {
    return
  }

  for (const envFile of [".env.test.local", ".env.test"]) {
    const envPath = path.join(process.cwd(), envFile)
    if (!existsSync(envPath)) {
      continue
    }

    const contents = readFileSync(envPath, "utf8")
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) {
        continue
      }

      const separatorIndex = line.indexOf("=")
      if (separatorIndex === -1) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()
      let value = line.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      runtimeEnv[key] = value
    }
  }

  for (const [sourceKey, targetKey] of TEST_MAPPINGS) {
    const value = runtimeEnv[sourceKey]
    if (!value) {
      throw new Error(`Missing required test environment variable: ${sourceKey}`)
    }

    runtimeEnv[targetKey] = value
  }

  runtimeEnv.EMAIL_DRIVER ||= "test"
  runtimeEnv.STORAGE_DRIVER ||= "test"
  runtimeEnv.OPS_WEBHOOK_URL ||= "test://ops-webhook"
  runtimeEnv.EMAIL_FROM ||= runtimeEnv.ADMIN_EMAIL ?? "e2e-admin@xistoh.com"
  runtimeEnv.APP_URL ||= runtimeEnv.NEXTAUTH_URL
  runtimeEnv.__JIMIN_GARDEN_TEST_ENV_LOADED = "1"
}

export function getProjectRoot() {
  return path.resolve(process.cwd())
}
