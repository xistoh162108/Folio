"use client"

import Link from "next/link"
import { useMemo } from "react"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"

import { V0GuestbookTerminalPanel } from "@/components/v0/public/guestbook-terminal-panel"
import { PublicShell } from "@/components/v0/public/public-shell"
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

interface GuestbookScreenClientProps {
  isDarkMode?: boolean
  brandLabel?: string
  initialEntries?: GuestbookEntryDTO[]
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
  instagramHref?: string | null
}

export function GuestbookScreenClient({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  initialEntries,
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
  instagramHref = null,
}: GuestbookScreenClientProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const runtimeDescriptor: V0RuntimeDescriptor = useMemo(
    () => ({
      mode: "life",
      variant: "guestbook",
      intensity: 0.2,
      scrambleText: "[GUEST_LOG_STREAM]",
    }),
    [],
  )

  return (
    <PublicShell
      currentPage={null}
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
      runtimeDescriptor={runtimeDescriptor}
    >
      <div className="min-h-full md:h-full md:overflow-y-auto">
        <main className="max-w-3xl px-4 py-6 sm:px-6 md:px-8">
          <div className="max-w-lg space-y-8">
            <section className="space-y-3">
              <Link href="/contact" className={`inline-block px-1 text-xs ${mutedText} ${hoverBg}`}>
                [&larr;] back to contact
              </Link>
              <p className={`text-xs ${mutedText}`}>// guestbook</p>
              <h2 className="text-lg">Visitor Log Terminal</h2>
              <p className={`text-sm ${mutedText}`}>
                Public trace archive. Leave a short line, browse the log, or jump back to the contact surface.
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className={mutedText}>contact:</span>{" "}
                  <a href={`mailto:${emailAddress}`} className={hoverBg}>
                    {emailAddress} -&gt;
                  </a>
                </p>
                <p>
                  <span className={mutedText}>github:</span>{" "}
                  {githubHref ? (
                    <a href={githubHref} target="_blank" rel="noreferrer" className={hoverBg}>
                      {githubHref.replace(/^https?:\/\//, "")} -&gt;
                    </a>
                  ) : (
                    <span>unlisted</span>
                  )}
                </p>
                <p>
                  <span className={mutedText}>linkedin:</span>{" "}
                  {linkedinHref ? (
                    <a href={linkedinHref} target="_blank" rel="noreferrer" className={hoverBg}>
                      {linkedinHref.replace(/^https?:\/\//, "")} -&gt;
                    </a>
                  ) : (
                    <span>unlisted</span>
                  )}
                </p>
                <p>
                  <span className={mutedText}>instagram:</span>{" "}
                  {instagramHref ? (
                    <a href={instagramHref} target="_blank" rel="noreferrer" className={hoverBg}>
                      {instagramHref.replace(/^https?:\/\//, "")} -&gt;
                    </a>
                  ) : (
                    <span>unlisted</span>
                  )}
                </p>
              </div>
            </section>

            <V0GuestbookTerminalPanel
              isDarkMode={isDarkMode}
              borderColor={borderColor}
              hoverBg={hoverBg}
              mutedText={mutedText}
              initialEntries={initialEntries}
              mode="full"
            />
          </div>
        </main>
      </div>
    </PublicShell>
  )
}
