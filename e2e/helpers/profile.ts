import { buildStaticProfileBootstrap, PRIMARY_PROFILE_SLUG } from "@/lib/profile/bootstrap"

import { testPrisma } from "./db"

export async function resetPrimaryProfile() {
  const bootstrap = buildStaticProfileBootstrap()

  await testPrisma.profile.upsert({
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
