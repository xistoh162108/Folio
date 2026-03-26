import bcrypt from "bcrypt"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { slugify } from "@/lib/utils/normalizers"

const DEFAULT_TOPICS = [
  "All Seeds",
  "AI & InfoSec",
  "Projects & Logs",
]

async function main() {
  for (const topic of DEFAULT_TOPICS) {
    await prisma.newsletterTopic.upsert({
      where: { normalizedName: slugify(topic) },
      update: { name: topic },
      create: {
        name: topic,
        normalizedName: slugify(topic),
      },
    })
  }

  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    const password = await bcrypt.hash(env.ADMIN_PASSWORD, 10)

    await prisma.user.upsert({
      where: { email: env.ADMIN_EMAIL },
      update: { password },
      create: {
        email: env.ADMIN_EMAIL,
        password,
      },
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
