import { SettingsScreen } from "@/components/v0/admin/settings-screen"
import { getPrimaryProfileRuntimeSnapshot, mapProfileEditorInput } from "@/lib/data/profile"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function SettingsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [snapshot, isDarkMode] = await Promise.all([getPrimaryProfileRuntimeSnapshot(), getV0ThemeIsDark()])

  return (
    <SettingsScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      profile={mapProfileEditorInput(snapshot)}
      profileSource={snapshot.source}
    />
  )
}
