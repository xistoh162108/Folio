import { SettingsScreen } from "@/components/v0/admin/settings-screen"
import { getPrimaryProfileSettingsSnapshot, mapProfileEditorInput } from "@/lib/data/profile"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function SettingsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [snapshot, isDarkMode] = await Promise.all([getPrimaryProfileSettingsSnapshot(), getV0ThemeIsDark()])

  return (
    <SettingsScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      profile={mapProfileEditorInput(snapshot)}
      profileSource={snapshot.source}
    />
  )
}
