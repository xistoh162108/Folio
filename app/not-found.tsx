import { PublicFallbackContent } from "@/components/v0/public/public-fallback-content"
import { PublicShell } from "@/components/v0/public/public-shell"
import { getPublicFallbackState } from "@/lib/site/public-fallback-state"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export default async function PublicNotFound() {
  const isDarkMode = await getV0ThemeIsDark()
  const fallback = getPublicFallbackState("route-not-found")

  return (
    <PublicShell currentPage={fallback.currentPage} isDarkMode={isDarkMode} runtimeDescriptor={fallback.runtimeDescriptor}>
      <PublicFallbackContent
        initialIsDarkMode={isDarkMode}
        eyebrow={fallback.eyebrow}
        title={fallback.title}
        code={fallback.code}
        message={fallback.message}
        accentKey={fallback.accentKey}
        actions={[
          { label: "[home]", href: "/" },
          { label: "[notes]", href: "/notes" },
          { label: "[projects]", href: "/projects" },
        ]}
      />
    </PublicShell>
  )
}
