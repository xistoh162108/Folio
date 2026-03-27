import { spawn } from "child_process"

import { PrismaClient } from "@prisma/client"

import { loadTestEnvironment } from "./test-env"

const RESET_TABLES = [
  "AuditLog",
  "Analytics",
  "WebhookDelivery",
  "ContactMessage",
  "NewsletterDelivery",
  "NewsletterCampaign",
  "NewsletterTopic",
  "Subscriber",
  "PostComment",
  "GuestbookEntry",
  "PostLike",
  "PostLink",
  "LinkPreviewCache",
  "PostAsset",
  "PostRevision",
  "_PostTags",
  "Tag",
  "ProfileLink",
  "ProfileAward",
  "ProfileExperience",
  "ProfileEducation",
  "Profile",
  "Post",
  "User",
] as const

async function runPnpmExec(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", ["exec", ...args], {
      stdio: "inherit",
      env: process.env,
    })

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Command interrupted by signal: ${signal}`))
        return
      }

      if (code !== 0) {
        reject(new Error(`pnpm exec ${args.join(" ")} failed with exit code ${code}`))
        return
      }

      resolve()
    })
  })
}

export async function prepareTestDatabase() {
  loadTestEnvironment()
  await runPnpmExec(["prisma", "migrate", "deploy"])
}

export async function resetTestDatabase() {
  loadTestEnvironment()
  const prisma = new PrismaClient()

  try {
    const tableList = RESET_TABLES.map((table) => `"${table}"`).join(", ")
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/does not exist|relation .* does not exist|42P01/i.test(message)) {
      throw new Error("Test database is not prepared. Run `pnpm test:db:prepare` before running the test suite.")
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}
