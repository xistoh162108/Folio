import { GuestbookScreen } from "@/components/v0/public/guestbook-screen"
import { getGuestbookEntriesPage } from "@/lib/data/guestbook"
import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"
import { getPublicVerifiedProfileLinks } from "@/lib/profile/public-links"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function GuestbookScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [entriesResult, isDarkMode, profile] = await Promise.all([
    getGuestbookEntriesPage(),
    getV0ThemeIsDark(),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const publicLinks = getPublicVerifiedProfileLinks(profile)

  return (
    <GuestbookScreen
      brandLabel={brandLabel}
      emailAddress={profile.emailAddress}
      githubHref={publicLinks.githubHref}
      initialEntries={entriesResult.entries}
      initialPagination={entriesResult.pagination}
      isDarkMode={isDarkMode}
      linkedinHref={publicLinks.linkedinHref}
    />
  )
}
