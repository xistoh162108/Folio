import { GuestbookScreen } from "@/components/v0/public/guestbook-screen"
import { getGuestbookEntries } from "@/lib/data/guestbook"
import { getPrimaryProfileRuntimeSnapshot, getVerifiedProfileLink } from "@/lib/data/profile"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function GuestbookScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [entries, isDarkMode, profile] = await Promise.all([
    getGuestbookEntries(),
    getV0ThemeIsDark(),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const githubLink = getVerifiedProfileLink(profile, "GITHUB")
  const linkedinLink = getVerifiedProfileLink(profile, "LINKEDIN")

  return (
    <GuestbookScreen
      brandLabel={brandLabel}
      emailAddress={profile.emailAddress}
      githubHref={githubLink?.url ?? null}
      initialEntries={entries}
      isDarkMode={isDarkMode}
      linkedinHref={linkedinLink?.url ?? null}
    />
  )
}
