import { CommunityScreen } from "@/components/v0/admin/community-screen"
import { getCommunityModerationSnapshot } from "@/lib/data/community"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function CommunityScreenBound({
  searchParams = Promise.resolve({}),
  brandLabel = "xistoh.log",
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
  brandLabel?: string
} = {}) {
  const query = await searchParams
  const [snapshot, isDarkMode] = await Promise.all([getCommunityModerationSnapshot(query), getV0ThemeIsDark()])

  return <CommunityScreen brandLabel={brandLabel} isDarkMode={isDarkMode} snapshot={snapshot} />
}
