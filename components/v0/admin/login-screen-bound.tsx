import { LoginScreen } from "@/components/v0/admin/login-screen"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function LoginScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const isDarkMode = await getV0ThemeIsDark()

  return <LoginScreen brandLabel={brandLabel} isDarkMode={isDarkMode} />
}
