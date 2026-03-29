import { HomeScreen } from "@/components/v0/public/home-screen"
import { getHomepagePosts } from "@/lib/data/posts"
import { getPrimaryProfileRuntimeSnapshot, getVerifiedProfileLink } from "@/lib/data/profile"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function HomeScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [isDarkMode, { notes }, profile] = await Promise.all([
    getV0ThemeIsDark(),
    getHomepagePosts(),
    getPrimaryProfileRuntimeSnapshot(),
  ])
  const githubLink = getVerifiedProfileLink(profile, "GITHUB")
  const linkedinLink = getVerifiedProfileLink(profile, "LINKEDIN")

  return (
    <HomeScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      profileName={profile.displayName}
      profileBio={profile.summary}
      emailAddress={profile.emailAddress}
      githubHref={githubLink?.url ?? null}
      linkedinHref={linkedinLink?.url ?? null}
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
      recentNotes={notes}
      resumeHref={profile.resumeHref ?? "/resume.pdf"}
    />
  )
}
