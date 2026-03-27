import type { GuestbookEntryDTO } from "@/lib/contracts/community"

import { ContactScreen } from "@/components/v0/public/contact-screen"

interface GuestbookScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  initialEntries?: GuestbookEntryDTO[]
  canModerate?: boolean
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
}

export function GuestbookScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  initialEntries,
  canModerate = false,
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
}: GuestbookScreenProps) {
  return (
    <ContactScreen
      brandLabel={brandLabel}
      canModerate={canModerate}
      emailAddress={emailAddress}
      focusSection="guestbook"
      githubHref={githubHref}
      initialGuestbookEntries={initialEntries}
      isDarkMode={initialIsDarkMode}
      linkedinHref={linkedinHref}
    />
  )
}
