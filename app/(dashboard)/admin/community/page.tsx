import { CommunityScreenBound } from "@/components/v0/admin/community-screen-bound"

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const commentPage = typeof resolved?.commentPage === "string" ? resolved.commentPage : undefined
  const guestbookPage = typeof resolved?.guestbookPage === "string" ? resolved.guestbookPage : undefined

  return <CommunityScreenBound commentPage={commentPage} guestbookPage={guestbookPage} />
}
