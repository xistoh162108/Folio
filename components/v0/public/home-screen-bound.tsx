import { HomeScreen } from "@/components/v0/public/home-screen"
import { getGuestbookEntries } from "@/lib/data/guestbook"
import { getHomepagePosts } from "@/lib/data/posts"
import { getPrimaryProfileRuntimeSnapshot } from "@/lib/data/profile"
import { getPublicVerifiedProfileLinks } from "@/lib/profile/public-links"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function HomeScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [isDarkMode, { notes, projects }, recentLogs, profile] = await Promise.all([
    getV0ThemeIsDark(),
    getHomepagePosts(),
    getGuestbookEntries(2),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const publicLinks = getPublicVerifiedProfileLinks(profile)

  return (
    <HomeScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      profileName={profile.displayName}
      profileBio={profile.summary}
      emailAddress={profile.emailAddress}
      githubHref={publicLinks.githubHref}
      linkedinHref={publicLinks.linkedinHref}
      instagramHref={publicLinks.instagramHref}
      education={profile.education.map((item) => ({
        id: item.id,
        period: item.period,
        label: item.degree ? `${item.institution}, ${item.degree}` : item.institution,
      }))}
      experience={profile.experience.map((item) => ({
        id: item.id,
        period: item.period,
        label: item.label,
      }))}
      awards={profile.awards.map((item) => ({
        id: item.id,
        period: item.year ?? "n/a",
        label: item.issuer ? `${item.title}, ${item.issuer}` : item.title,
      }))}
      recentNotes={notes.slice(0, 5)}
      recentProjects={projects.slice(0, 2)}
      recentLogs={recentLogs.slice(0, 2)}
      resumeHref={profile.resumeHref ?? "/resume.pdf"}
    />
  )
}
