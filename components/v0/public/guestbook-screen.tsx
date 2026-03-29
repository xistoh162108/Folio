import type { GuestbookEntryDTO } from "@/lib/contracts/community"

import { GuestbookScreenClient } from "@/components/v0/public/guestbook-screen-client"

interface GuestbookScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  initialEntries?: GuestbookEntryDTO[]
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
}

export function GuestbookScreen({
  isDarkMode = true,
  brandLabel = "xistoh.log",
  initialEntries,
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
}: GuestbookScreenProps) {
  return (
    <GuestbookScreenClient
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      initialEntries={initialEntries}
      emailAddress={emailAddress}
      githubHref={githubHref}
      linkedinHref={linkedinHref}
    />
  )
}
