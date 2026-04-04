import bcrypt from "bcrypt"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { buildStaticProfileBootstrap, PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"
import { slugify } from "@/lib/utils/normalizers"

const DEFAULT_TOPICS = [
  "All",
  "Project & Info",
  "Log",
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

  const bootstrap = buildStaticProfileBootstrap()

  await prisma.profile.upsert({
    where: { slug: PRIMARY_PROFILE_SLUG },
    update: {
      displayName: bootstrap.displayName,
      role: bootstrap.role,
      summary: bootstrap.summary,
      emailAddress: bootstrap.emailAddress,
      resumeHref: bootstrap.resumeHref,
      githubHref: bootstrap.githubHref,
      linkedinHref: bootstrap.linkedinHref,
      education: {
        deleteMany: {},
        create: bootstrap.education,
      },
      experience: {
        deleteMany: {},
        create: bootstrap.experience,
      },
      awards: {
        deleteMany: {},
        create: bootstrap.awards,
      },
      links: {
        deleteMany: {},
        create: bootstrap.links,
      },
    },
    create: {
      slug: bootstrap.slug,
      displayName: bootstrap.displayName,
      role: bootstrap.role,
      summary: bootstrap.summary,
      emailAddress: bootstrap.emailAddress,
      resumeHref: bootstrap.resumeHref,
      githubHref: bootstrap.githubHref,
      linkedinHref: bootstrap.linkedinHref,
      education: {
        create: bootstrap.education,
      },
      experience: {
        create: bootstrap.experience,
      },
      awards: {
        create: bootstrap.awards,
      },
      links: {
        create: bootstrap.links,
      },
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
