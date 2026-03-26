"use client"

import { useState } from "react"

import { ContactForm } from "@/components/contact-form"

export function ContactPanel() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
    _honey: "",
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-5">
      <ContactForm
        isDarkMode
        mutedText="text-zinc-500"
        borderColor="border-white/15"
        hoverBg="hover:bg-white/5"
        contactForm={contactForm}
        setContactForm={setContactForm}
      />
    </div>
  )
}
