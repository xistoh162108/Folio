import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AnalyticsTracker } from '../components/analytics-tracker'
import { V0ExperienceProvider } from '@/components/v0/runtime/v0-experience-runtime'
import { getV0ThemeMode } from '@/lib/site/v0-theme.server'
import "katex/dist/katex.min.css"
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://xistoh.com"),
  title: "xistoh.log",
  description: "Production-backed portfolio, notes, projects, and admin workflows.",
  applicationName: "xistoh.log",
  generator: "codex",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/mstile-144x144.png",
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
