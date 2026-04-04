import type { GuestbookEntryDTO, PaginatedCollectionStateDTO } from "@/lib/contracts/community"

import { GuestbookScreenClient } from "@/components/v0/public/guestbook-screen-client"

interface GuestbookScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  initialEntries?: GuestbookEntryDTO[]
  initialPagination?: PaginatedCollectionStateDTO
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
}

export function GuestbookScreen({
  isDarkMode = true,
  brandLabel = "xistoh.log",
  initialEntries,
  initialPagination,
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
}: GuestbookScreenProps) {
  return (
    <GuestbookScreenClient
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      initialEntries={initialEntries}
      initialPagination={initialPagination}
      emailAddress={emailAddress}
      githubHref={githubHref}
      linkedinHref={linkedinHref}
    />
  )
}
