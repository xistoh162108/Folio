"use client"

import type { Dispatch, SetStateAction } from "react"

import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

export interface V0ContactFormValues {
  name: string
  email: string
  message: string
  _honey: string
}

export interface V0ContactFormResult {
  success?: boolean
  message?: string
  error?: string
}

interface ContactTerminalFormProps {
  isDarkMode: boolean
  borderColor: string
  hoverBg: string
  mutedText: string
  contactForm: V0ContactFormValues
  setContactForm: Dispatch<SetStateAction<V0ContactFormValues>>
  state: V0ContactFormResult | null
  pending: boolean
  contactIntensity: number
  onSubmitForm: () => void
}

export function V0ContactTerminalForm({
  isDarkMode,
  borderColor,
  hoverBg,
  mutedText,
  contactForm,
  setContactForm,
  state,
  pending,
  contactIntensity,
  onSubmitForm,
}: ContactTerminalFormProps) {
  const accentColor = getV0RouteAccentPalette("contact", isDarkMode).color

  return (
    <section className="space-y-4">
      <p className={`text-xs ${mutedText}`}>// direct message</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmitForm()
        }}
        className="space-y-4"
      >
        <div>
          <input
            type="text"
            name="_honey"
            value={contactForm._honey}
            onChange={(event) => setContactForm({ ...contactForm, _honey: event.target.value })}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <input
            type="text"
            value={contactForm.name}
            onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
            placeholder="Name_"
            disabled={pending}
            className={`v0-terminal-input ${borderColor} ${
              isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
            } ${pending ? "opacity-50" : ""}`}
          />
        </div>
        <div>
          <input
            type="email"
            value={contactForm.email}
            onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
            placeholder="Email_"
            disabled={pending}
            className={`v0-terminal-input ${borderColor} ${
              isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
            } ${pending ? "opacity-50" : ""}`}
          />
        </div>
        <div className="relative">
          <textarea
            value={contactForm.message}
            onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
            placeholder="Message_"
            rows={4}
            disabled={pending}
            className={`v0-terminal-textarea ${borderColor} ${
              isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
            } ${pending ? "opacity-50" : ""}`}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`v0-control-inline-button ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
          style={contactIntensity > 0.5 ? { borderColor: accentColor, color: accentColor } : undefined}
        >
          {pending ? "[ TRANSMITTING... ]" : "[ Submit ]"}
        </button>
        {state?.success ? (
          <p className="text-xs" style={{ color: accentColor }}>[ OK: {state.message} ]</p>
        ) : null}
        {state?.error ? <p className="text-xs text-[#FF3333]">[ ERROR: {state.error} ]</p> : null}
      </form>
    </section>
  )
}
