import { CommunityScreenBound } from "@/components/v0/admin/community-screen-bound"

export default async function AdminCommunityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  return <CommunityScreenBound searchParams={searchParams} />
}
