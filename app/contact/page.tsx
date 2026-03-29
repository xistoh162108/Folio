import type { Metadata } from "next"

import { ContactScreen } from "@/components/v0/public/contact-screen"
import { getGuestbookEntries } from "@/lib/data/guestbook"
import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"
import { getPublicVerifiedProfileLinks } from "@/lib/profile/public-links"
import { buildPublicMetadata } from "@/lib/seo/metadata"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPrimaryProfileRuntimeSnapshot()

  return buildPublicMetadata({
    title: `Contact ${profile.displayName}`,
    description: `Reach ${profile.displayName} through the terminal contact form and jump into the guestbook log from the same exact xistoh.log world.`,
    path: "/contact",
  })
}

export default async function ContactPage() {
  const [isDarkMode, guestbookEntries, profile] = await Promise.all([
    getV0ThemeIsDark(),
    getGuestbookEntries(2),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const publicLinks = getPublicVerifiedProfileLinks(profile)

  return (
    <ContactScreen
      brandLabel="xistoh.log"
      emailAddress={profile.emailAddress}
      githubHref={publicLinks.githubHref}
      initialGuestbookEntries={guestbookEntries}
      isDarkMode={isDarkMode}
      instagramHref={publicLinks.instagramHref}
      linkedinHref={publicLinks.linkedinHref}
    />
  )
}
