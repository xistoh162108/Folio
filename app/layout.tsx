import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AnalyticsTracker } from '../components/analytics-tracker'
import { V0ExperienceProvider } from '@/components/v0/runtime/v0-experience-runtime'
import { getV0ThemeMode } from '@/lib/site/v0-theme.server'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://xistoh.com"),
  title: "xistoh.log",
  description: "Production-backed portfolio, notes, projects, and admin workflows.",
  generator: "codex",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeMode = await getV0ThemeMode()
  const isDarkMode = themeMode === "dark"

  return (
    <html lang="en" data-v0-theme={themeMode} suppressHydrationWarning style={{ colorScheme: themeMode }}>
      <body
        data-v0-theme={themeMode}
        style={{ colorScheme: themeMode }}
        className={`min-h-screen font-sans antialiased ${isDarkMode ? "bg-black text-white" : "bg-white text-black"} ${geist.variable} ${jetbrainsMono.variable}`}
      >
        <V0ExperienceProvider initialThemeMode={themeMode}>
          {children}
          <AnalyticsTracker />
          <Analytics />
        </V0ExperienceProvider>
      </body>
    </html>
  )
}
