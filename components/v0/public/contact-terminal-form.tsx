"use client"

import type { Dispatch, SetStateAction } from "react"

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
            className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
              isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
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
            className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
              isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
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
            className={`w-full bg-transparent border-b ${borderColor} pb-1 pt-0 text-sm leading-tight outline-none resize-none transition-colors ${
              isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
            } ${pending ? "opacity-50" : ""}`}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className={`border px-3 py-2 text-xs transition-all ${borderColor} ${hoverBg} ${
            contactIntensity > 0.5
              ? isDarkMode
                ? "border-[#D4FF00]/50 text-[#D4FF00]"
                : "border-[#3F5200]/50 text-[#3F5200]"
              : ""
          } ${pending ? "opacity-50" : ""}`}
        >
          {pending ? "[ TRANSMITTING... ]" : "[ Submit ]"}
        </button>
        {state?.success ? (
          <p className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[ OK: {state.message} ]</p>
        ) : null}
        {state?.error ? <p className="text-xs text-[#FF3333]">[ ERROR: {state.error} ]</p> : null}
      </form>
    </section>
  )
}
