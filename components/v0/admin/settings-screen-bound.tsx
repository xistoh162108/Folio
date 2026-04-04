import { SettingsScreen } from "@/components/v0/admin/settings-screen"
import { getPrimaryProfileSettingsEditorState } from "@/lib/data/profile"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function SettingsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [{ profile, source }, isDarkMode] = await Promise.all([getPrimaryProfileSettingsEditorState(), getV0ThemeIsDark()])

  return (
    <SettingsScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      profile={profile}
      profileSource={source}
    />
  )
}
