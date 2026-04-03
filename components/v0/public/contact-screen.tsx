"use client"

import { startTransition, useActionState, useMemo, useState } from "react"

import { V0ContactTerminalForm } from "@/components/v0/public/contact-terminal-form"
import { V0GuestbookTerminalPanel } from "@/components/v0/public/guestbook-terminal-panel"
import { PublicShell } from "@/components/v0/public/public-shell"
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import { submitContactMessage } from "@/lib/actions/contact.actions"
import type { GuestbookEntryDTO } from "@/lib/contracts/community"
import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

interface ContactScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
  initialGuestbookEntries?: GuestbookEntryDTO[]
}

const initialForm = {
  name: "",
  email: "",
  message: "",
  _honey: "",
}

export function ContactScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
  initialGuestbookEntries = [],
}: ContactScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const [contactForm, setContactForm] = useState(initialForm)
  const [state, formAction, pending] = useActionState(
    async (
      _previous: { success?: boolean; message?: string; error?: string } | null,
      payload: typeof initialForm,
    ) => {
      const result = await submitContactMessage(payload)
      if (result.success) {
        setContactForm(initialForm)
      }
      return result
    },
    null,
  )
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const accentColor = getV0RouteAccentPalette("contact", isDarkMode).color
  const contactIntensity = Math.min(1, (contactForm.name.length + contactForm.email.length + contactForm.message.length) / 100)
  const runtimeDescriptor: V0RuntimeDescriptor = useMemo(
    () => ({
      mode: "life",
      variant: "contact",
      intensity: Math.max(0.18, contactIntensity),
      scrambleText: "[CONNECTION_ESTABLISHED]",
    }),
    [contactIntensity],
  )

  return (
    <PublicShell
      currentPage="contact"
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
      runtimeDescriptor={runtimeDescriptor}
    >
      <div className="min-h-full md:h-full md:overflow-y-auto">
        <div className="flex min-h-full flex-col px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-1 flex-col justify-center">
            <div data-v0-contact-column className="max-w-lg space-y-8">
              <section className="space-y-3">
                <p className={`text-xs ${mutedText}`}>// contact</p>
                <h2 className="text-lg">Get in Touch</h2>
              </section>

              <p className="text-sm" style={{ color: accentColor }}>
                [*] Open to new opportunities &amp; collaborations
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <span className={mutedText}>email:</span>{" "}
                  <a href={`mailto:${emailAddress}`} className={isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}>
                    {emailAddress} -&gt;
                  </a>
                </p>
                <p>
                  <span className={mutedText}>github:</span>{" "}
                  {githubHref ? (
                    <a href={githubHref} target="_blank" rel="noreferrer" className={isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}>
                      {githubHref.replace(/^https?:\/\//, "")} -&gt;
                    </a>
                  ) : (
                    <span>unlisted</span>
                  )}
                </p>
                <p>
                  <span className={mutedText}>linkedin:</span>{" "}
                  {linkedinHref ? (
                    <a
                      href={linkedinHref}
                      target="_blank"
                      rel="noreferrer"
                      className={isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}
                    >
                      {linkedinHref.replace(/^https?:\/\//, "")} -&gt;
                    </a>
                  ) : (
                    <span>unlisted</span>
                  )}
                </p>
              </div>

              <V0ContactTerminalForm
                isDarkMode={isDarkMode}
                borderColor={borderColor}
                hoverBg={isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}
                mutedText={mutedText}
                contactForm={contactForm}
                setContactForm={setContactForm}
                state={state}
                pending={pending}
                contactIntensity={contactIntensity}
                onSubmitForm={() => {
                  startTransition(() => formAction(contactForm))
                }}
              />
            </div>
          </div>

          <V0GuestbookTerminalPanel
            isDarkMode={isDarkMode}
            borderColor={borderColor}
            hoverBg={isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}
            mutedText={mutedText}
            initialEntries={initialGuestbookEntries}
            mode="preview"
          />
        </div>
      </div>
    </PublicShell>
  )
}
