import { GuestbookScreen } from "@/components/v0/public/guestbook-screen"
import { getGuestbookEntries } from "@/lib/data/guestbook"
import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"
import { getPublicVerifiedProfileLinks } from "@/lib/profile/public-links"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function GuestbookScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [entries, isDarkMode, profile] = await Promise.all([
    getGuestbookEntries(),
    getV0ThemeIsDark(),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const publicLinks = getPublicVerifiedProfileLinks(profile)

  return (
    <GuestbookScreen
      brandLabel={brandLabel}
      emailAddress={profile.emailAddress}
      githubHref={publicLinks.githubHref}
      initialEntries={entries}
      isDarkMode={isDarkMode}
      instagramHref={publicLinks.instagramHref}
      linkedinHref={publicLinks.linkedinHref}
    />
  )
}
