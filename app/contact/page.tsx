import type { Metadata } from "next"

import { ContactScreen } from "@/components/v0/public/contact-screen"
import { getSession } from "@/lib/auth"
import { getGuestbookEntries } from "@/lib/data/guestbook"
import { getPrimaryProfileRuntimeSnapshot, getPrimaryProfileSnapshot, getVerifiedProfileLink } from "@/lib/data/profile"
import { buildPublicMetadata } from "@/lib/seo/metadata"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPrimaryProfileSnapshot()

  return buildPublicMetadata({
    title: `Contact ${profile.displayName}`,
    description: `Reach ${profile.displayName} through the terminal contact form and integrated guestbook log.`,
    path: "/contact",
  })
}

export default async function ContactPage() {
  const [isDarkMode, session, guestbookEntries, profile] = await Promise.all([
    getV0ThemeIsDark(),
    getSession(),
    getGuestbookEntries(),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const githubLink = getVerifiedProfileLink(profile, "GITHUB")
  const linkedinLink = getVerifiedProfileLink(profile, "LINKEDIN")

  return (
    <ContactScreen
      brandLabel="xistoh.log"
      canModerate={Boolean(session?.user?.id)}
      emailAddress={profile.emailAddress}
      githubHref={githubLink?.url ?? null}
      initialGuestbookEntries={guestbookEntries}
      isDarkMode={isDarkMode}
      linkedinHref={linkedinLink?.url ?? null}
    />
  )
}
