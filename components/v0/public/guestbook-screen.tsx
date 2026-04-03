import type { GuestbookEntryDTO } from "@/lib/contracts/community"
import type { GuestbookEntriesPage } from "@/lib/data/guestbook"

import { GuestbookScreenClient } from "@/components/v0/public/guestbook-screen-client"

interface GuestbookScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  initialEntries?: GuestbookEntryDTO[]
  initialPage?: GuestbookEntriesPage
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
  instagramHref?: string | null
}

export function GuestbookScreen({
  isDarkMode = true,
  brandLabel = "xistoh.log",
  initialEntries,
  initialPage,
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
  instagramHref = null,
}: GuestbookScreenProps) {
  return (
    <GuestbookScreenClient
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      initialEntries={initialEntries}
      initialPage={initialPage}
      emailAddress={emailAddress}
      githubHref={githubHref}
      instagramHref={instagramHref}
      linkedinHref={linkedinHref}
    />
  )
}
