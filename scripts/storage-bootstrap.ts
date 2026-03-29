import { existsSync, readFileSync } from "fs"
import path from "path"

function loadStorageBootstrapEnv() {
  for (const envFile of [".env.local", ".env"]) {
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
      if (process.env[key]) {
        continue
      }

      let value = line.slice(separatorIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  }
}

loadStorageBootstrapEnv()

async function main() {
  const { bootstrapStorageBuckets } = await import("@/lib/storage/supabase")
  const result = await bootstrapStorageBuckets()

  console.log(`[storage:${result.driver}] bootstrap complete`)
  for (const bucket of result.buckets) {
    console.log(`${bucket.bucket} :: ${bucket.exists ? "present" : "missing"} :: ${bucket.visibility}`)
  }
}

main().catch(async (error) => {
  const { mapStorageServiceError } = await import("@/lib/storage/supabase")
  console.error(mapStorageServiceError(error))
  process.exit(1)
})
