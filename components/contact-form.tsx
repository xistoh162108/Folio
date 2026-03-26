"use client"

import { useActionState, startTransition } from "react"
import { submitContactMessage } from "../lib/actions/contact.actions"

interface ContactFormProps {
  isDarkMode: boolean
  mutedText: string
  borderColor: string
  hoverBg: string
  contactForm: { name: string, email: string, message: string, _honey: string }
  setContactForm: (form: any) => void
}

export function ContactForm({
  isDarkMode,
  mutedText,
  borderColor,
  hoverBg,
  contactForm,
  setContactForm
}: ContactFormProps) {
  const [state, formAction, pending] = useActionState(
    async (prevState: any, payload: typeof contactForm) => {
      // Execute the atomic webhook queue Server Action seamlessly
      const res = await submitContactMessage(payload)
      if (res.success) {
        // Hard wipe the form after successful transmission
        setContactForm({ name: "", email: "", message: "", _honey: "" })
      }
      return res
    },
    null
  )

  const intensity = Math.min(1, (contactForm.name.length + contactForm.email.length + contactForm.message.length) / 100)

  return (
    <section className="space-y-4">
      <p className={`text-xs ${mutedText}`}>// direct message</p>
      
      {state?.success ? (
        <div className="space-y-2 border border-[#D4FF00]/30 p-4 font-mono">
          <p className="text-[#D4FF00] text-sm">[ SECURE CHANNEL ESTABLISHED ]</p>
          <p className={`text-xs ${mutedText}`}>{state.message ?? "Message transmitted successfully."}</p>
        </div>
      ) : (
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            startTransition(() => formAction(contactForm))
          }}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              name="_honey"
              value={contactForm._honey}
              onChange={(e) => setContactForm({ ...contactForm, _honey: e.target.value })}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <input
              type="text"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              placeholder="Name_"
              disabled={pending}
              className={`w-full bg-transparent border-b ${borderColor} pt-4 pb-0.5 text-sm outline-none transition-colors ${
                isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]" : "placeholder:text-black/30 focus:border-[#3F5200]"
              } ${pending ? "opacity-50" : ""}`}
            />
          </div>
          <div>
            <input
              type="email"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder="Email_"
              disabled={pending}
              className={`w-full bg-transparent border-b ${borderColor} pt-4 pb-0.5 text-sm outline-none transition-colors ${
                isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]" : "placeholder:text-black/30 focus:border-[#3F5200]"
              } ${pending ? "opacity-50" : ""}`}
            />
          </div>
          <div className="relative">
            <textarea
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="Message_"
              rows={4}
              disabled={pending}
              className={`w-full bg-transparent border-b ${borderColor} pt-4 pb-0.5 text-sm outline-none resize-none transition-colors leading-tight ${
                isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]" : "placeholder:text-black/30 focus:border-[#3F5200]"
              } ${pending ? "opacity-50" : ""}`}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`text-xs px-3 pt-3 pb-0.5 border-b transition-all ${borderColor} ${hoverBg} ${
              intensity > 0.5 
                ? (isDarkMode ? "border-[#D4FF00] text-[#D4FF00]" : "border-[#3F5200] text-[#3F5200]")
                : ""
            } ${pending ? "opacity-50" : ""}`}
          >
            {pending ? "[ TRANSMITTING... ]" : "[ Submit ]"}
          </button>
          
          {state?.error && <p className="text-[#FF3333] text-xs mt-2">[ ERROR: {state.error} ]</p>}
        </form>
      )}
    </section>
  )
}
