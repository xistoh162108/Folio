import { CommunityScreen } from "@/components/v0/admin/community-screen"
import { getCommunityModerationSnapshot } from "@/lib/data/community"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function CommunityScreenBound({
  brandLabel = "xistoh.log",
  commentPage,
  guestbookPage,
}: {
  brandLabel?: string
  commentPage?: string | number | null
  guestbookPage?: string | number | null
} = {}) {
  const [snapshot, isDarkMode] = await Promise.all([
    getCommunityModerationSnapshot({ commentPage, guestbookPage }),
    getV0ThemeIsDark(),
  ])

  return <CommunityScreen brandLabel={brandLabel} isDarkMode={isDarkMode} snapshot={snapshot} />
}
