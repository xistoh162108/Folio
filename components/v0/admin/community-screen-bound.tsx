import { CommunityScreen } from "@/components/v0/admin/community-screen"
import { getCommunityModerationSnapshot } from "@/lib/data/community"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function CommunityScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [snapshot, isDarkMode] = await Promise.all([getCommunityModerationSnapshot(), getV0ThemeIsDark()])

  return <CommunityScreen brandLabel={brandLabel} isDarkMode={isDarkMode} snapshot={snapshot} />
}
