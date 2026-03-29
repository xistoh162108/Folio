"use client"

import { AdminShell } from "@/components/v0/admin/admin-shell"
import { ProfileSettingsEditor } from "@/components/v0/admin/profile-settings-editor"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { ProfileEditorInput, ProfileSource } from "@/lib/contracts/profile"

interface SettingsScreenProps {
  profile: ProfileEditorInput
  profileSource: ProfileSource
  isDarkMode?: boolean
  brandLabel?: string
}

export function SettingsScreen({
  profile,
  profileSource,
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
}: SettingsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const accentText = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  return (
    <AdminShell currentSection="settings" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <main data-v0-settings-scroll className="min-h-full p-4 sm:p-6 md:h-full md:min-h-0 md:overflow-y-auto">
        <ProfileSettingsEditor
          initialProfile={profile}
          profileSource={profileSource}
          isDarkMode={isDarkMode}
          borderColor={borderColor}
          mutedText={mutedText}
          accentText={accentText}
          hoverBg={hoverBg}
        />
      </main>
    </AdminShell>
  )
}
